/**
 * WhatsApp Sticker Generator
 * Generates exact 512x512 WebP sticker with size <= 100 KB.
 */

export interface StickerOptions {
  fit: 'contain' | 'cover';
  padding?: number; // padding in px when using contain
  quality?: number; // 0.1 to 1.0
}

export interface GeneratedStickerResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  qualityUsed: number;
}

export async function generateSticker(
  file: File | Blob,
  options: StickerOptions = { fit: 'contain', padding: 16, quality: 0.85 }
): Promise<GeneratedStickerResult> {
  const { fit = 'contain', padding = 16, quality = 0.85 } = options;

  const img = await loadImage(file);
  const targetSize = 512;
  const maxBytes = 100 * 1024; // 100 KB for static sticker

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Clear transparent
  ctx.clearRect(0, 0, targetSize, targetSize);

  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;

  if (fit === 'contain') {
    const availableSize = targetSize - padding * 2;
    const ratio = Math.min(availableSize / srcWidth, availableSize / srcHeight);
    const drawWidth = Math.round(srcWidth * ratio);
    const drawHeight = Math.round(srcHeight * ratio);
    const dx = Math.round((targetSize - drawWidth) / 2);
    const dy = Math.round((targetSize - drawHeight) / 2);

    ctx.drawImage(img, dx, dy, drawWidth, drawHeight);
  } else {
    // 'cover': fill 512x512
    const ratio = Math.max(targetSize / srcWidth, targetSize / srcHeight);
    const sWidth = Math.round(targetSize / ratio);
    const sHeight = Math.round(targetSize / ratio);
    const sx = Math.round((srcWidth - sWidth) / 2);
    const sy = Math.round((srcHeight - sHeight) / 2);

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetSize, targetSize);
  }

  // Loop to ensure size <= 100 KB
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, 'image/webp', currentQuality);

  let attempts = 0;
  while (blob.size > maxBytes && currentQuality > 0.1 && attempts < 10) {
    currentQuality -= 0.1;
    blob = await canvasToBlob(canvas, 'image/webp', Math.max(0.1, currentQuality));
    attempts++;
  }

  const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'sticker';
  const fileName = `${originalName}_512x512.webp`;

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    fileSize: blob.size,
    width: targetSize,
    height: targetSize,
    qualityUsed: Math.round(currentQuality * 100) / 100,
  };
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for sticker generation: ' + e));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob returned null'));
      },
      format,
      quality
    );
  });
}
