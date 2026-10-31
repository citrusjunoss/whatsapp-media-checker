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
        const isH264 = mp4Info.videoCodec === 'avc1';
        const hasCodec = !!mp4Info.videoCodec;
        items.push({
          id: 'video_codec',
          name: '视频编码 (Video Codec)',
          status: isH264 ? 'pass' : hasCodec ? 'error' : 'warning',
          message: isH264
            ? `通过：H.264 编码 (${mp4Info.videoCodec})`
            : hasCodec
            ? `❌ 不兼容：检测到 ${mp4Info.videoCodec} 编码，WhatsApp 严格要求 H.264 (AVC1)`
            : `⚠️ 未能解析出视频轨编码格式，建议核对或转码`,
          expected: 'H.264 (avc1)',
          actual: mp4Info.videoCodec || '未识别',
        });

        if (!isH264) {
          availableFixes.push('transcode_video_ffmpeg');
          suggestions.push('当前视频非 H.264 编码，在部分接收端可能无法解码播放，建议一键转码为 H.264。');
        }

        // H.264 Profile check: Meta recommends Main (no B-frames) or Baseline
        const isHighWithBframes = mp4Info.h264Profile === 'High' && mp4Info.hasBframes;
        const profileStatus: CheckStatus = isHighWithBframes
          ? 'error'
          : mp4Info.h264Profile === 'High' || (mp4Info.h264Profile === 'Main' && mp4Info.hasBframes)
          ? 'warning'
          : 'pass';

        items.push({
          id: 'video_h264_profile',
          name: 'H.264 编码规格 (Profile)',
          status: profileStatus,
          message: isHighWithBframes
            ? '❌ Android 不兼容：检测到 H.264 High Profile 且含 B-frames。Meta 官方明确说明 Android WhatsApp 客户端不支持此组合，必须转码为 Main 或 Baseline！'
            : mp4Info.h264Profile === 'Main' && !mp4Info.hasBframes
            ? '通过：符合 Meta 官方推荐规格（H.264 Main Profile 无 B-frames）'
            : mp4Info.h264Profile === 'Baseline'
            ? '通过：H.264 Baseline Profile，兼容所有设备与客户端'
            : mp4Info.h264Profile === 'High'
            ? '⚠️ 兼容性提示：检测到 H.264 High Profile。为确保 Android 客户端最佳兼容，Meta 官方推荐使用 Main (无 B-frames) 或 Baseline。'
            : mp4Info.h264Profile
            ? `规格：H.264 ${mp4Info.h264Profile}`
            : '未知规格 (推荐使用 H.264 Main 或 Baseline)',
          expected: 'Main (官方推荐无 B-frames) | Baseline',
          actual: mp4Info.h264Profile ? `H.264 ${mp4Info.h264Profile}${mp4Info.h264Level ? ' Level ' + mp4Info.h264Level : ''}` : '未知',
          docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#video-formatting',
        });

        // B-frames check (ctts box presence)
        const bframesStatus: CheckStatus = isHighWithBframes
          ? 'error'
          : mp4Info.hasBframes
          ? 'warning'
          : 'pass';

        items.push({
          id: 'video_bframes',
          name: 'B-frames (双向预测帧检测)',
          status: bframesStatus,
          message: isHighWithBframes
            ? '❌ 严重不兼容：High Profile 包含 B-frames，会导致 Android WhatsApp 用户无法播放。请转码并添加 -bf 0 禁用 B-frames。'
            : mp4Info.hasBframes
            ? '⚠️ 包含 B-frames (检测到 ctts atom)：Meta 官方建议使用 -bf 0 禁用 B-frames，避免低端 Android 机型卡顿或黑屏。'
            : '通过：无 B-frames（未检测到 ctts atom），完全符合 Meta 最佳实践',
          expected: '无 B-frames (No B-frames)',
          actual: mp4Info.hasBframes ? '包含 B-frames (存在 ctts)' : '无 B-frames (合规)',
        });

        if (mp4Info.hasBframes) {
          availableFixes.push('transcode_video_ffmpeg');
          suggestions.push('Meta 官方说明：Android WhatsApp 客户端对含 B-frames 视频支持不佳，建议使用转码器移除 B-frames (-bf 0)。');
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

      // Check dimensions and aspect ratio
      const imgInfo = await inspectImage(file);
      metadata.width = imgInfo.width;
      metadata.height = imgInfo.height;
      metadata.aspectRatio = imgInfo.aspectRatio;

      // Rule: Template Header Image Aspect Ratio must be 3:2 (landscape), 1:1 (square), or 2:3 (portrait)
      if (imgInfo.width > 0 && imgInfo.height > 0) {
        const aspectCheck = evaluateHeaderImageAspectRatio(imgInfo.width, imgInfo.height);

        items.push({
          id: 'header_image_aspect_ratio',
          name: '模板 Header 图片比例规范',
          status: aspectCheck.pass ? 'pass' : 'error',
          message: aspectCheck.pass
            ? `通过：符合 WhatsApp 模板 Header 规范要求（${aspectCheck.matchedName}，${imgInfo.width}×${imgInfo.height}）`
            : `❌ 比例不合规：当前比例为 ${(imgInfo.width / imgInfo.height).toFixed(2)}:1 (${imgInfo.width}×${imgInfo.height})。WhatsApp 模板 Header 图片严格要求符合横版 3:2、方形 1:1 或 竖版 2:3 规范。`,
          expected: '横版 3:2 | 方形 1:1 | 竖版 2:3',
          actual: aspectCheck.ratioStr,
          docUrl: FORMAT_DOC_LINKS.RESUMABLE_UPLOAD,
        });

        if (!aspectCheck.pass) {
          availableFixes.push('compress_image');
          suggestions.push('模板 Header 图片需符合横版 3:2、方形 1:1 或 竖版 2:3 规范，可在右侧图片工具中选择预设比例进行框选裁剪。');
        }
      }

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
        const isH264 = mp4Info.videoCodec === 'avc1';
        const hasCodec = !!mp4Info.videoCodec;
        items.push({
          id: 'std_video_codec',
          name: '视频编码检测 (H.264)',
          status: isH264 ? 'pass' : hasCodec ? 'error' : 'warning',
          message: isH264
            ? `通过：检测为 H.264 编码 (${mp4Info.videoCodec})`
            : hasCodec
            ? `❌ 编码不合规：检测到 ${mp4Info.videoCodec}，官方要求 H.264 (avc1)`
            : `⚠️ 未能解析出视频轨编码格式，建议核对或转码`,
          expected: 'H.264 (avc1)',
          actual: mp4Info.videoCodec || '未识别',
        });

        if (!isH264) {
          availableFixes.push('transcode_video_ffmpeg');
        }

        // H.264 Profile check: Meta recommends Main (no B-frames) or Baseline
        const isHighWithBframes = mp4Info.h264Profile === 'High' && mp4Info.hasBframes;
        const profileStatus: CheckStatus = isHighWithBframes
          ? 'error'
          : mp4Info.h264Profile === 'High' || (mp4Info.h264Profile === 'Main' && mp4Info.hasBframes)
          ? 'warning'
          : 'pass';

        items.push({
          id: 'std_video_h264_profile',
          name: 'H.264 编码规格 (Profile)',
          status: profileStatus,
          message: isHighWithBframes
            ? '❌ Android 不兼容：检测到 H.264 High Profile 且含 B-frames。Meta 官方明确说明 Android WhatsApp 客户端不支持此组合，必须转码为 Main 或 Baseline！'
            : mp4Info.h264Profile === 'Main' && !mp4Info.hasBframes
            ? '通过：符合 Meta 官方推荐规格（H.264 Main Profile 无 B-frames）'
            : mp4Info.h264Profile === 'Baseline'
            ? '通过：H.264 Baseline Profile，兼容所有设备与客户端'
            : mp4Info.h264Profile === 'High'
            ? '⚠️ 兼容性提示：检测到 H.264 High Profile。为确保 Android 客户端最佳兼容，Meta 官方推荐使用 Main (无 B-frames) 或 Baseline。'
            : mp4Info.h264Profile
            ? `规格：H.264 ${mp4Info.h264Profile}`
            : '未知规格 (推荐使用 H.264 Main 或 Baseline)',
          expected: 'Main (官方推荐无 B-frames) | Baseline',
          actual: mp4Info.h264Profile ? `H.264 ${mp4Info.h264Profile}${mp4Info.h264Level ? ' Level ' + mp4Info.h264Level : ''}` : '未知',
          docUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media#video-formatting',
        });

        // B-frames check (ctts box presence)
        const bframesStatus: CheckStatus = isHighWithBframes
          ? 'error'
          : mp4Info.hasBframes
          ? 'warning'
          : 'pass';

        items.push({
          id: 'std_video_bframes',
          name: 'B-frames (双向预测帧检测)',
          status: bframesStatus,
          message: isHighWithBframes
            ? '❌ 严重不兼容：High Profile 包含 B-frames，会导致 Android WhatsApp 用户无法播放。请转码并添加 -bf 0 禁用 B-frames。'
            : mp4Info.hasBframes
            ? '⚠️ 包含 B-frames (检测到 ctts atom)：Meta 官方建议使用 -bf 0 禁用 B-frames，避免低端 Android 机型卡顿或黑屏。'
            : '通过：无 B-frames（未检测到 ctts atom），完全符合 Meta 最佳实践',
          expected: '无 B-frames (No B-frames)',
          actual: mp4Info.hasBframes ? '包含 B-frames (存在 ctts)' : '无 B-frames (合规)',
        });

        if (mp4Info.hasBframes) {
          availableFixes.push('transcode_video_ffmpeg');
          suggestions.push('Meta 官方说明：Android WhatsApp 客户端对含 B-frames 视频支持不佳，建议使用转码器移除 B-frames (-bf 0)。');
        }

        const isAac = mp4Info.audioCodec === 'mp4a';
        const hasAudio = !!mp4Info.audioCodec;
        items.push({
          id: 'std_audio_codec',
          name: '音频轨编码 (AAC)',
          status: isAac ? 'pass' : hasAudio ? 'warning' : 'pass',
          message: isAac
            ? `通过：AAC 音频轨 (${mp4Info.audioCodec})`
            : hasAudio
            ? `⚠️ 音频编码为 ${mp4Info.audioCodec}，建议转为 AAC (mp4a)`
            : `通过：无音频轨或为静音视频 (WhatsApp 允许单音频轨或无音轨)`,
          expected: 'AAC (mp4a) 或 无音轨',
          actual: mp4Info.audioCodec || (mp4Info.audioTracksCount === 0 ? '无音频轨 (合规)' : '未识别'),
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

export function evaluateHeaderImageAspectRatio(width: number, height: number): {
  pass: boolean;
  matchedName: string | null;
  ratioStr: string;
} {
  if (width <= 0 || height <= 0) {
    return { pass: true, matchedName: null, ratioStr: '0:0' };
  }
  const ratio = width / height;
  let matchedName: string | null = null;

  // Meta WhatsApp Template Header aspect ratio specifications:
  // 横版 3:2 (1.5), 方形 1:1 (1.0), 竖版 2:3 (0.667)
  if (Math.abs(ratio - 1.5) <= 0.05) {
    matchedName = '横版 3:2';
  } else if (Math.abs(ratio - 1.0) <= 0.04) {
    matchedName = '方形 1:1';
  } else if (Math.abs(ratio - 2 / 3) <= 0.04) {
    matchedName = '竖版 2:3';
  }

  return {
    pass: matchedName !== null,
    matchedName,
    ratioStr: matchedName
      ? `${width} × ${height} (${matchedName})`
      : `${width} × ${height} (${ratio.toFixed(2)}:1)`,
  };
}

function isMimeMatchingExt(mime: string, ext: string): boolean {
  if (!ext) return true;
  if (['jpg', 'jpeg'].includes(ext) && mime === 'image/jpeg') return true;
  if (ext === 'png' && mime === 'image/png') return true;
  if (ext === 'webp' && mime === 'image/webp') return true;
  if (ext === 'gif' && mime === 'image/gif') return true;
  if (ext === 'pdf' && mime === 'application/pdf') return true;
  if (['mp4', 'm4v', 'mov', 'qt'].includes(ext) && (mime === 'video/mp4' || mime === 'video/quicktime')) return true;
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
