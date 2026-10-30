/**
 * Sniff file magic bytes from ArrayBuffer slice
 */
export interface SniffResult {
  mime: string;
  category: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'unknown';
  extension: string;
  description: string;
}

export async function sniffMagicBytes(file: File): Promise<SniffResult> {
  const sliceSize = Math.min(file.size, 128);
  const buffer = await file.slice(0, sliceSize).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (bytes.length < 4) {
    return {
      mime: file.type || 'application/octet-stream',
      category: 'unknown',
      extension: '',
      description: '文件过小或为空',
    };
  }

  // 1. JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return {
      mime: 'image/jpeg',
      category: 'image',
      extension: 'jpg',
      description: 'JPEG / JPG 图像',
    };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return {
      mime: 'image/png',
      category: 'image',
      extension: 'png',
      description: 'PNG 图像',
    };
  }

  // 3. GIF: 47 49 46 38 ('GIF8')
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return {
      mime: 'image/gif',
      category: 'image',
      extension: 'gif',
      description: 'GIF 图像（WhatsApp 标准不支持直接发动图，需转 MP4/贴纸）',
    };
  }

  // 4. RIFF container (WEBP or WAV)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    // Check bytes 8-11: 'WEBP'
    if (
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return {
        mime: 'image/webp',
        category: 'sticker', // WEBP is used for WhatsApp Stickers
        extension: 'webp',
        description: 'WebP 图像（WhatsApp 用于贴纸 Sticker）',
      };
    }
    // Check bytes 8-11: 'WAVE'
    if (
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45
    ) {
      return {
        mime: 'audio/wav',
        category: 'audio',
        extension: 'wav',
        description: 'WAV 音频（非 WhatsApp 直接标准格式，建议转 MP3/AAC）',
      };
    }
  }

  // 5. PDF: %PDF- (25 50 44 46 2D)
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return {
      mime: 'application/pdf',
      category: 'document',
      extension: 'pdf',
      description: 'PDF 便携式文档',
    };
  }

  // 6. MP4 / 3GP / QuickTime (ISO Base Media File Format)
  // Check bytes 4-7 for 'ftyp'
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    // Check major brand at bytes 8-11
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (brand.startsWith('3g') || brand.startsWith('3p')) {
      return {
        mime: 'video/3gp',
        category: 'video',
        extension: '3gp',
        description: '3GP 视频',
      };
    }
    if (brand === 'M4A ' || brand === 'm4a ') {
      return {
        mime: 'audio/mp4',
        category: 'audio',
        extension: 'm4a',
        description: 'M4A (MP4 Audio) 音频',
      };
    }
    return {
      mime: 'video/mp4',
      category: 'video',
      extension: 'mp4',
      description: `MP4 视频 (Brand: ${brand.trim()})`,
    };
  }

  // 7. AMR Audio: #!AMR\n (23 21 41 4D 52 0A)
  if (
    bytes[0] === 0x23 &&
    bytes[1] === 0x21 &&
    bytes[2] === 0x41 &&
    bytes[3] === 0x4d &&
    bytes[4] === 0x52 &&
    bytes[5] === 0x0a
  ) {
    return {
      mime: 'audio/amr',
      category: 'audio',
      extension: 'amr',
      description: 'AMR 语音音频',
    };
  }

  // 8. Ogg: OggS (4F 67 67 53)
  if (
    bytes[0] === 0x4f &&
    bytes[1] === 0x67 &&
    bytes[2] === 0x67 &&
    bytes[3] === 0x53
  ) {
    return {
      mime: 'audio/ogg',
      category: 'audio',
      extension: 'ogg',
      description: 'Ogg 音频 (Opus 语音)',
    };
  }

  // 9. MP3: ID3 (49 44 33) or MPEG sync frame (FF FB or FF F3 or FF F2)
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  ) {
    return {
      mime: 'audio/mpeg',
      category: 'audio',
      extension: 'mp3',
      description: 'MP3 (MPEG Audio)',
    };
  }

  // 10. AAC ADTS: FF F1 or FF F9
  if (bytes[0] === 0xff && (bytes[1] === 0xf1 || bytes[1] === 0xf9)) {
    return {
      mime: 'audio/aac',
      category: 'audio',
      extension: 'aac',
      description: 'AAC (ADTS) 音频',
    };
  }

  // 11. ZIP container (could be DOCX, XLSX, PPTX, or general ZIP)
  if (
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  ) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'docx') {
      return {
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        category: 'document',
        extension: 'docx',
        description: 'Microsoft Word 文档 (.docx)',
      };
    }
    if (ext === 'xlsx') {
      return {
        mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        category: 'document',
        extension: 'xlsx',
        description: 'Microsoft Excel 表格 (.xlsx)',
      };
    }
    if (ext === 'pptx') {
      return {
        mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        category: 'document',
        extension: 'pptx',
        description: 'Microsoft PowerPoint 幻灯片 (.pptx)',
      };
    }
    return {
      mime: 'application/zip',
      category: 'document',
      extension: 'zip',
      description: 'ZIP 压缩包或 OpenXML 文档',
    };
  }

  // 12. Legacy Office OLE2: D0 CF 11 E0 A1 B1 1A E1
  if (
    bytes[0] === 0xd0 &&
    bytes[1] === 0xcf &&
    bytes[2] === 0x11 &&
    bytes[3] === 0xe0
  ) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'doc') {
      return {
        mime: 'application/msword',
        category: 'document',
        extension: 'doc',
        description: 'Microsoft Word 文档 (.doc 早期格式)',
      };
    }
    if (ext === 'xls') {
      return {
        mime: 'application/vnd.ms-excel',
        category: 'document',
        extension: 'xls',
        description: 'Microsoft Excel 表格 (.xls 早期格式)',
      };
    }
    if (ext === 'ppt') {
      return {
        mime: 'application/vnd.ms-powerpoint',
        category: 'document',
        extension: 'ppt',
        description: 'Microsoft PowerPoint 幻灯片 (.ppt 早期格式)',
      };
    }
    return {
      mime: 'application/x-ole-storage',
      category: 'document',
      extension: 'ole',
      description: 'OLE2 复合文档 (旧版 Office 格式)',
    };
  }

  // 13. Plain Text check (ASCII / UTF-8 printable)
  const isPrintable = bytes.slice(0, 32).every(
    (b) => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13 || b >= 128
  );
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (isPrintable && (ext === 'txt' || file.type === 'text/plain')) {
    return {
      mime: 'text/plain',
      category: 'document',
      extension: 'txt',
      description: 'Plain Text 纯文本文件',
    };
  }

  // Fallback to browser file.type and extension
  return fallbackDetection(file);
}

function fallbackDetection(file: File): SniffResult {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const type = file.type;

  if (type.startsWith('image/')) {
    return {
      mime: type,
      category: ext === 'webp' ? 'sticker' : 'image',
      extension: ext,
      description: `${type} 图像`,
    };
  }
  if (type.startsWith('video/')) {
    return {
      mime: type,
      category: 'video',
      extension: ext,
      description: `${type} 视频`,
    };
  }
  if (type.startsWith('audio/')) {
    return {
      mime: type,
      category: 'audio',
      extension: ext,
      description: `${type} 音频`,
    };
  }
  if (
    type === 'application/pdf' ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)
  ) {
    return {
      mime: type || 'application/octet-stream',
      category: 'document',
      extension: ext,
      description: `${ext.toUpperCase()} 文档`,
    };
  }

  return {
    mime: type || 'application/octet-stream',
    category: 'unknown',
    extension: ext,
    description: `未识别类型 (${type || ext})`,
  };
}
