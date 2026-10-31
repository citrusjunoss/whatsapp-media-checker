import { describe, it, expect } from 'vitest';
import { validateMediaFile } from '../validator';
import { generateApiSnippets } from '../apiHelper';

describe('WhatsApp Media Checker Core Validation', () => {
  it('should block Audio files in Template Header mode, but allow in Standard mode', async () => {
    // Fake MP3 ID3 header
    const mp3Bytes = new Uint8Array([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    const audioFile = new File([mp3Bytes], 'podcast.mp3', { type: 'audio/mpeg' });

    // Standard mode check
    const stdResult = await validateMediaFile(audioFile, 'standard');
    expect(stdResult.detectedCategory).toBe('audio');
    expect(stdResult.overallStatus).not.toBe('error');

    // Template header mode check
    const headerResult = await validateMediaFile(audioFile, 'template_header');
    expect(headerResult.overallStatus).toBe('error');
    expect(headerResult.statusReason).toContain('模板 Header 不支持');
  });

  it('should reject non-PDF documents (e.g. DOCX) in Template Header mode', async () => {
    // Fake ZIP / DOCX header (PK\x03\x04)
    const docxBytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
    const docFile = new File([docxBytes], 'contract.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Standard mode: DOCX is allowed
    const stdResult = await validateMediaFile(docFile, 'standard');
    expect(stdResult.detectedCategory).toBe('document');
    expect(stdResult.overallStatus).toBe('pass');

    // Template Header mode: Only PDF is allowed, DOCX must be blocked
    const headerResult = await validateMediaFile(docFile, 'template_header');
    expect(headerResult.overallStatus).toBe('error');
    const docItem = headerResult.items.find((i) => i.id === 'header_doc_format');
    expect(docItem?.status).toBe('error');
    expect(docItem?.message).toContain('仅支持 PDF 格式');
  });

  it('should accept valid PDF in both Standard and Template Header mode', async () => {
    // Fake PDF header (%PDF-1.7)
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const pdfFile = new File([pdfBytes], 'report.pdf', { type: 'application/pdf' });

    const stdResult = await validateMediaFile(pdfFile, 'standard');
    expect(stdResult.overallStatus).toBe('pass');

    const headerResult = await validateMediaFile(pdfFile, 'template_header');
    expect(headerResult.overallStatus).toBe('pass');
  });

  it('should detect oversized image (> 5MB)', async () => {
    // 5.5 MB fake buffer
    const largeSize = 5.5 * 1024 * 1024;
    const bytes = new Uint8Array(largeSize);
    bytes[0] = 0xff;
    bytes[1] = 0xd8;
    bytes[2] = 0xff; // JPEG magic bytes

    const imgFile = new File([bytes], 'huge_photo.jpg', { type: 'image/jpeg' });
    const res = await validateMediaFile(imgFile, 'standard');

    expect(res.overallStatus).toBe('error');
    const sizeItem = res.items.find((i) => i.id === 'std_image_size');
    expect(sizeItem?.status).toBe('error');
    expect(res.availableFixes).toContain('compress_image');
  });

  it('should generate correct API snippets for Template Header vs Standard Mode', () => {
    // Template Header Snippets
    const headerSnippets = generateApiSnippets(
      { name: 'banner.jpg', size: 102400, detectedMime: 'image/jpeg', category: 'image' },
      'template_header',
      { appId: '1122334455' }
    );

    expect(headerSnippets.step1Curl).toContain('POST "https://graph.facebook.com/v26.0/1122334455/uploads');
    expect(headerSnippets.step2Curl).toContain('file_offset: 0');
    expect(headerSnippets.templateComponentJson).toContain('"header_handle"');

    // Standard Snippets
    const stdSnippets = generateApiSnippets(
      { name: 'banner.jpg', size: 102400, detectedMime: 'image/jpeg', category: 'image' },
      'standard',
      { phoneNumberId: '9988776655' }
    );

    expect(stdSnippets.standardUploadCurl).toContain('POST "https://graph.facebook.com/v26.0/9988776655/media"');
    expect(stdSnippets.sendMessageCurl).toContain('POST "https://graph.facebook.com/v26.0/9988776655/messages"');
  });

  it('should recommend official Meta video parameters: H.264 Main, no B-frames, FastStart, <= 16MB', async () => {
    const { getRecommendedFFmpegCommand } = await import('../converter/videoConverter');
    const cmd = getRecommendedFFmpegCommand('promo.mp4', true);

    expect(cmd).toContain('-profile:v main');
    expect(cmd).toContain('-bf 0');
    expect(cmd).toContain('-movflags +faststart');
    expect(cmd).toContain('-fs 16000000');
    expect(cmd).toContain('-c:a aac');
  });

  it('should accurately inspect Non-FastStart MP4 with moov at end of file', async () => {
    const fs = await import('fs');
    const { inspectMp4 } = await import('../mp4Inspector');

    if (fs.existsSync('/tmp/mp4test/sample_moov_at_end.mp4')) {
      const buffer = fs.readFileSync('/tmp/mp4test/sample_moov_at_end.mp4');
      const file = new File([buffer], 'sample_non_faststart.mp4', { type: 'video/mp4' });

      const res = await inspectMp4(file);
      expect(res.isMp4).toBe(true);
      expect(res.hasFastStart).toBe(false); // moov is at the end, so hasFastStart is false
      expect(res.videoCodec).toBe('avc1'); // H.264 video codec accurately extracted
      expect(res.h264Profile).toBe('Baseline'); // H.264 profile accurately extracted
      expect(res.audioCodec).toBe('mp4a'); // AAC audio codec accurately extracted
    }
  });

  it('should validate Template Header image aspect ratios: 3:2, 1:1, 2:3', async () => {
    const { evaluateHeaderImageAspectRatio } = await import('../validator');

    // 1. 横版 3:2 (e.g. 1200x800)
    const landscapeCheck = evaluateHeaderImageAspectRatio(1200, 800);
    expect(landscapeCheck.pass).toBe(true);
    expect(landscapeCheck.matchedName).toBe('横版 3:2');

    // 2. 方形 1:1 (e.g. 1000x1000)
    const squareCheck = evaluateHeaderImageAspectRatio(1000, 1000);
    expect(squareCheck.pass).toBe(true);
    expect(squareCheck.matchedName).toBe('方形 1:1');

    // 3. 竖版 2:3 (e.g. 800x1200)
    const portraitCheck = evaluateHeaderImageAspectRatio(800, 1200);
    expect(portraitCheck.pass).toBe(true);
    expect(portraitCheck.matchedName).toBe('竖版 2:3');

    // 4. 不合规比例 (e.g. 16:9 / 1920x1080, 4:3 / 1024x768)
    const invalidCheck169 = evaluateHeaderImageAspectRatio(1920, 1080);
    expect(invalidCheck169.pass).toBe(false);
    expect(invalidCheck169.matchedName).toBe(null);

    const invalidCheck43 = evaluateHeaderImageAspectRatio(1024, 768);
    expect(invalidCheck43.pass).toBe(false);
    expect(invalidCheck43.matchedName).toBe(null);
  });
});
