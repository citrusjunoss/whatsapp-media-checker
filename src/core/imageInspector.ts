/**
 * Inspect image properties: dimensions, aspect ratio, animated status
 */

export interface ImageInspectionResult {
  width: number;
  height: number;
  aspectRatio: string;
  isExactStickerSize: boolean; // 512x512
  isSquare: boolean;
  isAnimated: boolean;
}

export async function inspectImage(file: File): Promise<ImageInspectionResult> {
  if (typeof Image === 'undefined') {
    return {
      width: 0,
      height: 0,
      aspectRatio: '0:0',
      isExactStickerSize: false,
      isSquare: false,
      isAnimated: false,
    };
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      URL.revokeObjectURL(url);
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const isSquare = width === height;
      const isExactStickerSize = width === 512 && height === 512;
      const gcdVal = gcd(width, height);
      const aspectRatio = `${width / gcdVal}:${height / gcdVal}`;

      // Check if WebP or GIF is animated
      let isAnimated = false;
      if (file.type === 'image/gif' || file.name.endsWith('.gif')) {
        isAnimated = await checkGifAnimated(file);
      } else if (file.type === 'image/webp' || file.name.endsWith('.webp')) {
        isAnimated = await checkWebpAnimated(file);
      }

      resolve({
        width,
        height,
        aspectRatio,
        isExactStickerSize,
        isSquare,
        isAnimated,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: 0,
        height: 0,
        aspectRatio: '0:0',
        isExactStickerSize: false,
        isSquare: false,
        isAnimated: false,
      });
    };

    img.src = url;
  });
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

async function checkGifAnimated(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 1024 * 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let frames = 0;
    // Search for Graphic Control Extension (0x21 0xF9)
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) {
        frames++;
        if (frames > 1) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

async function checkWebpAnimated(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 64).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // WebP extended header VP8X: byte 12 to 15 is 'VP8X' (0x56 0x50 0x38 0x58)
    if (
      bytes[12] === 0x56 &&
      bytes[13] === 0x50 &&
      bytes[14] === 0x38 &&
      bytes[15] === 0x58
    ) {
      // Flags byte at offset 20: bit 1 is Animation flag (0x02)
      return (bytes[20] & 0x02) !== 0;
    }
    return false;
  } catch {
    return false;
  }
}
