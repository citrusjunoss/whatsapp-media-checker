import {
  CheckMode,
  CheckStatus,
  CheckItem,
  ValidationResult,
  AvailableFix,
  SIZE_LIMITS,
  FORMAT_DOC_LINKS,
  STANDARD_DOCUMENT_MIMES,
  STANDARD_AUDIO_MIMES,
  STANDARD_VIDEO_MIMES,
  STANDARD_IMAGE_MIMES,
} from './rules';

export type { CheckMode, CheckStatus, CheckItem, ValidationResult, AvailableFix };
import { sniffMagicBytes } from './magicBytes';
import { inspectMp4 } from './mp4Inspector';
import { inspectImage } from './imageInspector';
import { inspectAudio } from './audioInspector';

export async function validateMediaFile(
  file: File,
  mode: CheckMode
): Promise<ValidationResult> {
  const sniff = await sniffMagicBytes(file);
  const items: CheckItem[] = [];
  const suggestions: string[] = [];
  const availableFixes: AvailableFix[] = [];
  const metadata: Record<string, any> = {};

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const detectedCategory = sniff.category;
  const detectedMime = sniff.mime;

  // 1. Magic Bytes & MIME consistency check
  const mimeMatchesExt = isMimeMatchingExt(detectedMime, ext);
  items.push({
    id: 'magic_bytes',
    name: '文件真实格式（Magic Bytes）',
    status: mimeMatchesExt ? 'pass' : 'warning',
    message: mimeMatchesExt
      ? `检测通过：${sniff.description}`
      : `扩展名 (.${ext}) 与嗅探到的实际二进制格式 (${sniff.mime}) 可能不匹配，建议核对`,
    expected: `合法媒体头签名`,
    actual: `${sniff.mime} (${sniff.description})`,
  });

  // -------------------------------------------------------------
  // MODE 1: TEMPLATE HEADER MODE (Special Graph API /uploads checks)
  // -------------------------------------------------------------
  if (mode === 'template_header') {
    metadata.checkModeTitle = 'WhatsApp 模板 Header 模式（Graph API Resumable Upload）';

    // Rule: Template Header STRICTLY rejects Audio and Stickers
    if (detectedCategory === 'audio') {
      items.push({
        id: 'header_type_support',
        name: '模板 Header 媒体类型支持',
        status: 'error',
        message: '❌ WhatsApp 消息模板 Header 明确不支持音频文件。Header 仅可配置图片、视频或文档。',
        expected: 'IMAGE | VIDEO | DOCUMENT',
        actual: `Audio (${detectedMime})`,
        docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
      });
      suggestions.push('模板 Header 不支持任何音频。若需发送音频，请在普通消息中使用标准媒体接口。');
      return buildResult(file, sniff, mode, 'error', '模板 Header 不支持音频类型', items, metadata, suggestions, availableFixes);
    }

    if (detectedCategory === 'sticker') {
      items.push({
        id: 'header_type_support',
        name: '模板 Header 媒体类型支持',
        status: 'error',
        message: '❌ WhatsApp 消息模板 Header 不支持贴纸 Sticker。Header 仅支持图片、视频或文档。',
        expected: 'IMAGE (JPG/PNG) | VIDEO (MP4) | DOCUMENT (PDF)',
        actual: `Sticker (WebP)`,
        docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
      });
      suggestions.push('若需将该图像作为模板 Header 图片展示，请转换为标准 JPG 或 PNG 格式。');
      availableFixes.push('compress_image');
      return buildResult(file, sniff, mode, 'error', '模板 Header 不支持贴纸类型', items, metadata, suggestions, availableFixes);
    }

    // Rule: Template Header DOCUMENT must ONLY be PDF
    if (detectedCategory === 'document') {
      const isPdf = detectedMime === 'application/pdf' || ext === 'pdf';
      items.push({
        id: 'header_doc_format',
        name: '模板 Header 文档格式限制',
        status: isPdf ? 'pass' : 'error',
        message: isPdf
          ? '通过：格式为标准 application/pdf，符合 Resumable Upload 要求'
          : `❌ 拦截：模板 Header 上传 API 仅支持 PDF 格式 (file_type: application/pdf)。不支持 ${ext.toUpperCase()} 或 Office 文档。`,
        expected: 'application/pdf (.pdf)',
        actual: `${detectedMime} (.${ext})`,
        docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
      });

      if (!isPdf) {
        suggestions.push('Meta 官方 Resumable Upload 接口在上传模板样本时仅接受 PDF 文档，请将此文件另存为或打印为 PDF 后重试。');
        availableFixes.push('convert_to_pdf');
      }

      // Size check for document (≤100MB)
      const sizePass = file.size <= SIZE_LIMITS.DOCUMENT;
      items.push({
        id: 'header_doc_size',
        name: '文档文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `大小合规：${formatBytes(file.size)} (上限 100 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出 Meta 上限 100 MB`,
        expected: '≤ 100 MB',
        actual: formatBytes(file.size),
      });
    }

    // Rule: Template Header VIDEO must ONLY be MP4 (No 3GP)
    if (detectedCategory === 'video') {
      const isMp4 = detectedMime === 'video/mp4' || ext === 'mp4';
      items.push({
        id: 'header_video_format',
        name: '模板 Header 视频格式',
        status: isMp4 ? 'pass' : 'error',
        message: isMp4
          ? '通过：格式为 MP4 (video/mp4)'
          : `❌ 拦截：模板 Header 上传仅支持 MP4 格式。3GP、MOV 等其他格式不支持。`,
        expected: 'video/mp4 (.mp4)',
        actual: `${detectedMime} (.${ext})`,
        docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
      });

      if (!isMp4) {
        availableFixes.push('transcode_video_ffmpeg');
        suggestions.push('请转码为 H.264 编码的 MP4 视频后再上传模板 Header。');
      }

      // Size check for video (≤16MB)
      const sizePass = file.size <= SIZE_LIMITS.VIDEO;
      items.push({
        id: 'header_video_size',
        name: '视频文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `大小合规：${formatBytes(file.size)} (上限 16 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，超出 16 MB 限制`,
        expected: '≤ 16 MB',
        actual: formatBytes(file.size),
      });

      if (!sizePass) {
        availableFixes.push('transcode_video_ffmpeg');
        suggestions.push('视频体积超过 16 MB，请使用压缩功能降低分辨率或码率。');
      }

      // Deep MP4 check
      const mp4Info = await inspectMp4(file);
      metadata.video = mp4Info;
      metadata.hasFastStart = mp4Info.hasFastStart;
      metadata.videoCodec = mp4Info.videoCodec;
      metadata.audioCodec = mp4Info.audioCodec;
      metadata.duration = mp4Info.durationSeconds;

      if (mp4Info.isMp4) {
        const isH264 = !mp4Info.videoCodec || mp4Info.videoCodec === 'avc1';
        items.push({
          id: 'video_codec',
          name: '视频编码 (Video Codec)',
          status: isH264 ? 'pass' : 'error',
          message: isH264
            ? `通过：H.264 编码 (${mp4Info.videoCodec || 'avc1'})`
            : `❌ 不兼容：检测到 ${mp4Info.videoCodec} 编码，WhatsApp 严格要求 H.264 (AVC1)`,
          expected: 'H.264 (avc1)',
          actual: mp4Info.videoCodec || '未知/已兼容',
        });

        if (!isH264) {
          availableFixes.push('transcode_video_ffmpeg');
          suggestions.push('当前视频非 H.264 编码，在部分接收端可能无法解码播放，建议一键转码为 H.264。');
        }

        items.push({
          id: 'video_faststart',
          name: 'FastStart 流式优化 (moov 在前)',
          status: mp4Info.hasFastStart ? 'pass' : 'warning',
          message: mp4Info.hasFastStart
            ? '通过：moov 元数据位于文件头部，支持秒开和缩略图渲染'
            : '⚠️ 建议优化：moov atom 位于文件尾部，建议开启 FastStart 以免上传审核卡顿',
          expected: 'moov 在 mdat 之前',
          actual: mp4Info.hasFastStart ? '已优化' : '未开启 FastStart',
        });

        if (!mp4Info.hasFastStart) {
          availableFixes.push('fix_faststart');
        }
      }
    }

    // Rule: Template Header IMAGE must be JPG or PNG, <= 5MB
    if (detectedCategory === 'image') {
      const isJpgOrPng = ['image/jpeg', 'image/png'].includes(detectedMime) || ['jpg', 'jpeg', 'png'].includes(ext);
      items.push({
        id: 'header_image_format',
        name: '模板 Header 图片格式',
        status: isJpgOrPng ? 'pass' : 'error',
        message: isJpgOrPng
          ? `通过：格式为 ${detectedMime}`
          : `❌ 不兼容：模板 Header 仅支持 JPEG 或 PNG。不支持 WebP、GIF 或 SVG。`,
        expected: 'image/jpeg | image/png',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
      });

      if (!isJpgOrPng) {
        availableFixes.push('compress_image');
        suggestions.push('模板 Header 仅支持 JPG/PNG，请使用右侧转换器转换为 JPG 或 PNG。');
      }

      const sizePass = file.size <= SIZE_LIMITS.IMAGE;
      items.push({
        id: 'header_image_size',
        name: '图片文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `大小合规：${formatBytes(file.size)} (上限 5 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出 5 MB 限制`,
        expected: '≤ 5 MB',
        actual: formatBytes(file.size),
      });

      if (!sizePass) {
        availableFixes.push('compress_image');
        suggestions.push('图片大小超过 5 MB，请使用一键智能压缩器降低体积。');
      }

      // Check dimensions
      const imgInfo = await inspectImage(file);
      metadata.width = imgInfo.width;
      metadata.height = imgInfo.height;
      metadata.aspectRatio = imgInfo.aspectRatio;

      if (imgInfo.isAnimated) {
        items.push({
          id: 'image_animated',
          name: '动图检测',
          status: 'error',
          message: '❌ 模板 Header 不支持动图，请使用静态图片或改用视频 Header。',
          expected: '静态图像',
          actual: '动图 (Animated)',
        });
      }
    }
  }

  // -------------------------------------------------------------
  // MODE 2: STANDARD MEDIA MODE (/PHONE_NUMBER_ID/media)
  // -------------------------------------------------------------
  else {
    metadata.checkModeTitle = 'WhatsApp 标准媒体模式（Cloud API /media）';

    // 1. IMAGE
    if (detectedCategory === 'image') {
      const isStandardMime = STANDARD_IMAGE_MIMES.includes(detectedMime) || ['jpg', 'jpeg', 'png'].includes(ext);
      items.push({
        id: 'std_image_format',
        name: '图片支持格式',
        status: isStandardMime ? 'pass' : 'warning',
        message: isStandardMime
          ? `通过：${detectedMime}`
          : `⚠️ 格式提示：WhatsApp Cloud API 官方标准图片为 JPEG/PNG。如果是动图请转为 MP4。`,
        expected: 'image/jpeg | image/png',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.STANDARD_MEDIA,
      });

      const sizePass = file.size <= SIZE_LIMITS.IMAGE;
      items.push({
        id: 'std_image_size',
        name: '图片文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `通过：${formatBytes(file.size)} (上限 5 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出上限 5 MB`,
        expected: '≤ 5 MB',
        actual: formatBytes(file.size),
      });

      if (!sizePass) {
        availableFixes.push('compress_image');
        suggestions.push('图片超出 5 MB，请使用压缩功能处理。');
      }

      const imgInfo = await inspectImage(file);
      metadata.width = imgInfo.width;
      metadata.height = imgInfo.height;
      metadata.aspectRatio = imgInfo.aspectRatio;

      if (imgInfo.width > 0) {
        items.push({
          id: 'image_dimensions',
          name: '图片分辨率与宽高比',
          status: 'pass',
          message: `分辨率：${imgInfo.width} × ${imgInfo.height} px（宽高比 ${imgInfo.aspectRatio}）`,
          expected: '有效分辨率',
          actual: `${imgInfo.width}×${imgInfo.height}`,
        });
      }

      // Can offer sticker creation fix
      availableFixes.push('make_sticker');
    }

    // 2. VIDEO
    else if (detectedCategory === 'video') {
      const isStandardVideo = STANDARD_VIDEO_MIMES.includes(detectedMime) || ['mp4', '3gp', '3gpp'].includes(ext);
      items.push({
        id: 'std_video_format',
        name: '视频格式支持',
        status: isStandardVideo ? 'pass' : 'error',
        message: isStandardVideo
          ? `通过：支持格式 ${detectedMime}`
          : `❌ 不支持的容器格式 (${detectedMime})，WhatsApp 仅支持 MP4 与 3GP。`,
        expected: 'video/mp4 | video/3gp',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.STANDARD_MEDIA,
      });

      if (!isStandardVideo) {
        availableFixes.push('transcode_video_ffmpeg');
        suggestions.push('请转码为标准 MP4 (H.264 + AAC) 格式后再发送。');
      }

      const sizePass = file.size <= SIZE_LIMITS.VIDEO;
      items.push({
        id: 'std_video_size',
        name: '视频文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `通过：${formatBytes(file.size)} (上限 16 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超过 16 MB 上限`,
        expected: '≤ 16 MB',
        actual: formatBytes(file.size),
      });

      if (!sizePass) {
        availableFixes.push('transcode_video_ffmpeg');
        suggestions.push('视频体积超过 16 MB，无法通过 WhatsApp API 发送，需压缩处理。');
      }

      const mp4Info = await inspectMp4(file);
      metadata.video = mp4Info;
      metadata.hasFastStart = mp4Info.hasFastStart;
      metadata.videoCodec = mp4Info.videoCodec;
      metadata.audioCodec = mp4Info.audioCodec;
      metadata.duration = mp4Info.durationSeconds;

      if (mp4Info.isMp4) {
        const isH264 = !mp4Info.videoCodec || mp4Info.videoCodec === 'avc1';
        items.push({
          id: 'std_video_codec',
          name: '视频编码检测 (H.264)',
          status: isH264 ? 'pass' : 'error',
          message: isH264
            ? `通过：检测为 H.264 编码 (${mp4Info.videoCodec || 'avc1'})`
            : `❌ 编码不合规：检测到 ${mp4Info.videoCodec}，官方要求 H.264`,
          expected: 'H.264 (avc1)',
          actual: mp4Info.videoCodec || '未知/已兼容',
        });

        if (!isH264) {
          availableFixes.push('transcode_video_ffmpeg');
        }

        const isAac = !mp4Info.audioCodec || mp4Info.audioCodec === 'mp4a';
        items.push({
          id: 'std_audio_codec',
          name: '音频轨编码 (AAC)',
          status: isAac ? 'pass' : 'warning',
          message: isAac
            ? `通过：AAC 音频轨 (${mp4Info.audioCodec || 'mp4a'})`
            : `⚠️ 音频编码为 ${mp4Info.audioCodec}，建议转为 AAC`,
          expected: 'AAC (mp4a)',
          actual: mp4Info.audioCodec || '无音轨/正常',
        });

        items.push({
          id: 'std_video_faststart',
          name: 'FastStart 流式优化 (moov 在前)',
          status: mp4Info.hasFastStart ? 'pass' : 'warning',
          message: mp4Info.hasFastStart
            ? '通过：已开启 FastStart，支持客户端即时缓冲'
            : '⚠️ 建议优化：moov atom 位于文件尾部，客户端接收后需完整下载才能预览',
          expected: 'moov 在 mdat 之前',
          actual: mp4Info.hasFastStart ? '已开启' : '未开启',
        });

        if (!mp4Info.hasFastStart) {
          availableFixes.push('fix_faststart');
        }
      }
    }

    // 3. AUDIO
    else if (detectedCategory === 'audio') {
      const isStandardAudio = STANDARD_AUDIO_MIMES.some((m) => detectedMime.startsWith(m)) ||
        ['aac', 'mp3', 'm4a', 'amr', 'ogg'].includes(ext);

      items.push({
        id: 'std_audio_format',
        name: '音频格式支持',
        status: isStandardAudio ? 'pass' : 'warning',
        message: isStandardAudio
          ? `通过：支持格式 ${detectedMime}`
          : `⚠️ 非主流格式 (${detectedMime})，建议转换为标准 MP3 或 AAC`,
        expected: 'AAC | MP4 Audio | AMR | MP3 | OGG (Opus)',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.STANDARD_MEDIA,
      });

      const sizePass = file.size <= SIZE_LIMITS.AUDIO;
      items.push({
        id: 'std_audio_size',
        name: '音频文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `通过：${formatBytes(file.size)} (上限 16 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出上限 16 MB`,
        expected: '≤ 16 MB',
        actual: formatBytes(file.size),
      });

      if (!sizePass || !isStandardAudio) {
        availableFixes.push('convert_audio_mp3');
        suggestions.push('建议使用内置纯前端音频转换器，一键转为 128kbps 标准 MP3 文件。');
      }

      const audioInfo = await inspectAudio(file);
      metadata.duration = audioInfo.durationSeconds;
      metadata.audioChannels = audioInfo.channels;
      metadata.sampleRate = audioInfo.sampleRate;
    }

    // 4. DOCUMENT
    else if (detectedCategory === 'document') {
      const isStandardDoc = STANDARD_DOCUMENT_MIMES.includes(detectedMime) ||
        ['pdf', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);

      items.push({
        id: 'std_doc_format',
        name: '文档格式支持',
        status: isStandardDoc ? 'pass' : 'warning',
        message: isStandardDoc
          ? `通过：支持的文档类型 ${ext.toUpperCase()}`
          : `⚠️ 文档类型 (${detectedMime})，Meta 推荐使用 PDF 或 Office 常用文档`,
        expected: 'PDF | DOC/DOCX | XLS/XLSX | PPT/PPTX | TXT',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.STANDARD_MEDIA,
      });

      const sizePass = file.size <= SIZE_LIMITS.DOCUMENT;
      items.push({
        id: 'std_doc_size',
        name: '文档文件大小',
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `通过：${formatBytes(file.size)} (上限 100 MB)`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出上限 100 MB`,
        expected: '≤ 100 MB',
        actual: formatBytes(file.size),
      });
    }

    // 5. STICKER
    else if (detectedCategory === 'sticker') {
      items.push({
        id: 'sticker_format',
        name: '贴纸格式 (WebP)',
        status: detectedMime === 'image/webp' ? 'pass' : 'error',
        message: detectedMime === 'image/webp' ? '通过：image/webp 格式' : '❌ 贴纸必须是 WebP 格式',
        expected: 'image/webp',
        actual: detectedMime,
        docUrl: FORMAT_DOC_LINKS.STANDARD_MEDIA,
      });

      const imgInfo = await inspectImage(file);
      metadata.width = imgInfo.width;
      metadata.height = imgInfo.height;
      metadata.isAnimated = imgInfo.isAnimated;

      const isExact512 = imgInfo.isExactStickerSize;
      items.push({
        id: 'sticker_dimensions',
        name: '贴纸尺寸严格 512×512',
        status: isExact512 ? 'pass' : 'error',
        message: isExact512
          ? '通过：严格符合 512×512 px 规范'
          : `❌ 尺寸不合规：当前为 ${imgInfo.width}×${imgInfo.height}，WhatsApp 强制要求严格等于 512×512 像素`,
        expected: '512 × 512 px',
        actual: `${imgInfo.width} × ${imgInfo.height} px`,
      });

      const limit = imgInfo.isAnimated ? SIZE_LIMITS.STICKER_ANIMATED : SIZE_LIMITS.STICKER_STATIC;
      const sizePass = file.size <= limit;
      items.push({
        id: 'sticker_size',
        name: `贴纸大小 (${imgInfo.isAnimated ? '动态 ≤500KB' : '静态 ≤100KB'})`,
        status: sizePass ? 'pass' : 'error',
        message: sizePass
          ? `通过：${formatBytes(file.size)} (上限 ${formatBytes(limit)})`
          : `❌ 超标：当前 ${formatBytes(file.size)}，已超出 ${formatBytes(limit)} 上限`,
        expected: `≤ ${formatBytes(limit)}`,
        actual: formatBytes(file.size),
      });

      if (!isExact512 || !sizePass) {
        availableFixes.push('make_sticker');
        suggestions.push('可使用一键贴纸转换器，自动裁剪或缩放并压缩至 512×512 且 ≤100KB。');
      }
    }

    // 6. UNKNOWN
    else {
      items.push({
        id: 'unknown_format',
        name: '格式识别',
        status: 'error',
        message: `无法将 ${file.name} 匹配到 WhatsApp 支持的媒体分类中。`,
        expected: 'Image | Video | Audio | Document | Sticker',
        actual: detectedMime || '未知',
      });
    }
  }

  // Calculate overall verdict
  let overallStatus: CheckStatus = 'pass';
  let statusReason = '文件完全符合 WhatsApp 媒体规范，可直接发送！';

  const hasError = items.some((it) => it.status === 'error');
  const hasWarning = items.some((it) => it.status === 'warning');

  if (hasError) {
    overallStatus = 'error';
    const firstErr = items.find((it) => it.status === 'error');
    statusReason = firstErr ? firstErr.message : '文件存在不符合规范的项目，无法正常发送。';
  } else if (hasWarning) {
    overallStatus = 'warning';
    statusReason = '文件基本合规，但存在可优化项（如 FastStart 或格式规范度）。';
  }

  return buildResult(
    file,
    sniff,
    mode,
    overallStatus,
    statusReason,
    items,
    metadata,
    suggestions,
    availableFixes
  );
}

function buildResult(
  file: File,
  sniff: any,
  mode: CheckMode,
  overallStatus: CheckStatus,
  statusReason: string,
  items: CheckItem[],
  metadata: Record<string, any>,
  suggestions: string[],
  availableFixes: AvailableFix[]
): ValidationResult {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    detectedMime: sniff.mime,
    detectedCategory: sniff.category,
    mode,
    overallStatus,
    statusReason,
    items,
    metadata,
    suggestions,
    availableFixes: Array.from(new Set(availableFixes)),
    timestamp: Date.now(),
  };
}

function isMimeMatchingExt(mime: string, ext: string): boolean {
  if (!ext) return true;
  if (['jpg', 'jpeg'].includes(ext) && mime === 'image/jpeg') return true;
  if (ext === 'png' && mime === 'image/png') return true;
  if (ext === 'webp' && mime === 'image/webp') return true;
  if (ext === 'gif' && mime === 'image/gif') return true;
  if (ext === 'pdf' && mime === 'application/pdf') return true;
  if (ext === 'mp4' && mime === 'video/mp4') return true;
  if (['3gp', '3gpp'].includes(ext) && (mime === 'video/3gp' || mime === 'video/3gpp')) return true;
  if (ext === 'mp3' && mime === 'audio/mpeg') return true;
  if (ext === 'm4a' && mime === 'audio/mp4') return true;
  if (ext === 'ogg' && mime === 'audio/ogg') return true;
  if (['docx', 'xlsx', 'pptx'].includes(ext) && mime.includes('openxmlformats')) return true;
  if (['doc', 'xls', 'ppt'].includes(ext) && (mime.includes('ms-') || mime.includes('msword'))) return true;
  if (ext === 'txt' && mime === 'text/plain') return true;
  return false;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
