/**
 * Pure frontend Image Converter, Cropper & Smart Compressor
 * Supports converting any browser-loadable image to standard JPEG or PNG,
 * cropping to target aspect ratio (3:2, 1:1, 2:3, or custom),
 * and auto-compressing down to <= 5MB (Meta WhatsApp compliance).
 */

export interface ImageCropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageConversionOptions {
  format: 'image/jpeg' | 'image/png';
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  targetMaxBytes?: number; // default 5MB
  crop?: ImageCropRect; // Optional crop in source image pixel coordinates
}

export interface ConvertedImageResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  width: number;
  height: number;
  qualityUsed: number;
}

export async function convertAndCompressImage(
  file: File | Blob,
  options: ImageConversionOptions
): Promise<ConvertedImageResult> {
  const {
    format = 'image/jpeg',
    quality = 0.85,
    maxWidth = 2560,
    maxHeight = 2560,
    targetMaxBytes = 5 * 1024 * 1024, // 5MB
    crop,
  } = options;

  const img = await loadImage(file);
  const natW = img.naturalWidth || img.width;
  const natH = img.naturalHeight || img.height;

  // Determine source crop bounds
  const srcX = crop ? Math.max(0, Math.min(natW, crop.x)) : 0;
  const srcY = crop ? Math.max(0, Math.min(natH, crop.y)) : 0;
  const srcW = crop ? Math.max(1, Math.min(natW - srcX, crop.width)) : natW;
  const srcH = crop ? Math.max(1, Math.min(natH - srcY, crop.height)) : natH;

  let width = srcW;
  let height = srcH;

  // Scale down if cropped region exceeds max dimensions
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // If converting to JPEG, fill white background for transparent pixels
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, width, height);

  // If PNG, attempt standard toBlob first
  if (format === 'image/png') {
    let blob = await canvasToBlob(canvas, 'image/png');
    // If PNG is > 5MB, scale down canvas until it fits 5MB
    let scale = 0.9;
    while (blob.size > targetMaxBytes && scale > 0.3) {
      const nw = Math.round(width * scale);
      const nh = Math.round(height * scale);
      canvas.width = nw;
      canvas.height = nh;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, nw, nh);
      blob = await canvasToBlob(canvas, 'image/png');
      scale -= 0.15;
    }

    const ext = 'png';
    const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'converted';
    const fileName = `${originalName}_optimized.${ext}`;

    return {
      blob,
      url: URL.createObjectURL(blob),
      fileName,
      fileSize: blob.size,
      width: canvas.width,
      height: canvas.height,
      qualityUsed: 1.0,
    };
  }

  // For JPEG: Run binary search or iterative step for quality to fit targetMaxBytes
  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, 'image/jpeg', currentQuality);

  // If exceeds targetMaxBytes, progressively decrease quality
  if (blob.size > targetMaxBytes) {
    let minQ = 0.3;
    let maxQ = currentQuality;
    for (let i = 0; i < 5; i++) {
      const midQ = (minQ + maxQ) / 2;
      const testBlob = await canvasToBlob(canvas, 'image/jpeg', midQ);
      if (testBlob.size <= targetMaxBytes) {
        blob = testBlob;
        currentQuality = midQ;
        minQ = midQ; // try to get better quality
      } else {
        maxQ = midQ;
      }
    }

    // If still > targetMaxBytes even at minQ, scale down resolution
    let scale = 0.8;
    while (blob.size > targetMaxBytes && scale > 0.2) {
      const nw = Math.round(width * scale);
      const nh = Math.round(height * scale);
      canvas.width = nw;
      canvas.height = nh;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, nw, nh);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, nw, nh);
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.65);
      scale -= 0.15;
    }
  }

  const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'converted';
  const fileName = `${originalName}_optimized.jpg`;

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    fileSize: blob.size,
    width: canvas.width,
    height: canvas.height,
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
      reject(new Error('Failed to load image for conversion: ' + e));
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
