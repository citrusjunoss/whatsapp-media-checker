import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoConversionOptions {
  enableFastStart?: boolean;
  compressTo16MB?: boolean;
  targetMaxBytes?: number; // default 15.5MB
  onProgress?: (progressPercent: number, stageMessage: string) => void;
  onLog?: (message: string) => void;
}

export interface ConvertedVideoResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  commandUsed: string;
}

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

export async function getFFmpeg(
  onProgress?: (percent: number, msg: string) => void
): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  const ffmpeg = new FFmpeg();
  ffmpegInstance = ffmpeg;

  onProgress?.(5, '正在初始化 FFmpeg WebAssembly 内核...');

  // Use unpkg CDN for core-mt (multi-thread) or single-thread
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    isLoaded = true;
    onProgress?.(20, 'FFmpeg 内核加载就绪');
  } catch (err) {
    console.error('Failed to load FFmpeg wasm:', err);
    throw new Error('加载浏览器 FFmpeg 核心失败，请检查网络或浏览器 WebAssembly 支持：' + err);
  }

  return ffmpeg;
}

export async function convertVideo(
  file: File | Blob,
  options: VideoConversionOptions = {}
): Promise<ConvertedVideoResult> {
  const {
    enableFastStart = true,
    compressTo16MB = true,
    targetMaxBytes = 15.5 * 1024 * 1024,
    onProgress,
    onLog,
  } = options;

  const ffmpeg = await getFFmpeg(onProgress);

  const inputName = 'input_' + (file instanceof File ? file.name : 'video.mp4');
  const outputName = 'output_whatsapp.mp4';

  onProgress?.(25, '正在将视频装载入浏览器内存虚拟文件系统...');
  await ffmpeg.writeFile(inputName, await fetchFile(file));

  ffmpeg.on('log', ({ message }) => {
    onLog?.(message);
  });

  ffmpeg.on('progress', ({ progress }) => {
    // progress is 0.0 to 1.0
    const pct = Math.min(95, 30 + Math.round(progress * 65));
    onProgress?.(pct, `正在转码视频... ${Math.round(progress * 100)}%`);
  });

  // Construct FFmpeg command arguments
  const args = ['-i', inputName];

  // Video codec: H.264 Baseline profile for maximum WhatsApp compatibility
  args.push('-c:v', 'libx264', '-profile:v', 'baseline', '-level', '3.0', '-preset', 'ultrafast');

  // Video compression parameters
  if (compressTo16MB && (file.size > targetMaxBytes || (file as any).size > targetMaxBytes)) {
    // If oversized, downscale resolution to max 1280x720 and use higher CRF
    args.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,scale=min(1280\\,iw):-2', '-crf', '28');
  } else {
    // Normal quality, ensure even dimensions
    args.push('-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-crf', '23');
  }

  // Audio codec: AAC, 128k, stereo or mono
  args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2');

  // FastStart: move moov atom to the beginning of the file
  if (enableFastStart) {
    args.push('-movflags', '+faststart');
  }

  args.push('-y', outputName);

  const commandStr = `ffmpeg ${args.join(' ')}`;
  onProgress?.(30, '开始执行转码...');

  await ffmpeg.exec(args);

  onProgress?.(96, '正在读取并封装转码后的 MP4 文件...');
  const data = await ffmpeg.readFile(outputName);
  const rawBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const copyBuffer = new ArrayBuffer(rawBytes.byteLength);
  new Uint8Array(copyBuffer).set(rawBytes);
  const blob = new Blob([copyBuffer], { type: 'video/mp4' });

  // Clean up memory in virtual fs
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // ignore cleanup errors
  }

  const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'video';
  const fileName = `${originalName}_whatsapp.mp4`;

  onProgress?.(100, '视频转码完成！');

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    fileSize: blob.size,
    commandUsed: commandStr,
  };
}

export function getRecommendedFFmpegCommand(fileName: string, isOversized = false): string {
  const crf = isOversized ? 28 : 23;
  return `ffmpeg -i "${fileName}" -c:v libx264 -profile:v baseline -level 3.0 -preset medium -crf ${crf} -vf "scale=min(1280\\,iw):-2:flags=lanczos" -c:a aac -b:a 128k -ac 2 -movflags +faststart output.mp4`;
}
