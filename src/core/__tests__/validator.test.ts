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
});
