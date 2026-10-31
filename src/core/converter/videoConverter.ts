import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoConversionOptions {
  profile?: 'main' | 'baseline';
  durationSeconds?: number;
  enableFastStart?: boolean;
  compressTo16MB?: boolean;
  targetMaxBytes?: number; // default 15.0MB to strictly guarantee <= 16MB
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

  // Use unpkg CDN for core
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
    profile = 'main',
    durationSeconds,
    enableFastStart = true,
    compressTo16MB = true,
    targetMaxBytes = 15.0 * 1024 * 1024, // 15.0 MB safe threshold (strictly <= 16MB)
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
    onProgress?.(pct, `正在转码视频 (H.264 ${profile.toUpperCase()} 无 B-frames)... ${Math.round(progress * 100)}%`);
  });

  // Calculate bitrate based on duration to strictly guarantee <= 16MB
  const fileSize = file.size || (file as any).size || 0;
  const isLarge = fileSize > targetMaxBytes;
  const effectiveDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : (isLarge ? 90 : 45);

  const totalBits = targetMaxBytes * 8;
  const totalBps = totalBits / Math.max(effectiveDuration, 3);
  const audioBps = 128 * 1000;
  let targetVideoKbps = Math.floor((totalBps - audioBps) / 1000);

  // Reasonable bounds
  if (targetVideoKbps < 150) targetVideoKbps = 150;
  if (targetVideoKbps > 2500) targetVideoKbps = 2500;

  // Construct FFmpeg command arguments
  const args = ['-i', inputName];

  // Video codec: H.264 Main (recommended by Meta) or Baseline, strictly WITHOUT B-frames (-bf 0)
  args.push('-c:v', 'libx264', '-profile:v', profile, '-bf', '0', '-preset', 'ultrafast');

  // Video resolution scaling and bitrate control to strictly constrain size <= 16MB
  if (isLarge || (durationSeconds && durationSeconds > 60)) {
    // Large or longer videos: scale down to max 1280x720 or 960x540
    const maxDim = durationSeconds && durationSeconds > 120 ? '854' : '1280';
    args.push(
      '-vf',
      `scale=trunc(iw/2)*2:trunc(ih/2)*2,scale=min(${maxDim}\\,iw):-2`,
      '-b:v',
      `${targetVideoKbps}k`,
      '-maxrate',
      `${Math.round(targetVideoKbps * 1.15)}k`,
      '-bufsize',
      `${Math.round(targetVideoKbps * 2)}k`
    );
  } else {
    args.push(
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2,scale=min(1280\\,iw):-2',
      '-b:v',
      `${targetVideoKbps}k`,
      '-maxrate',
      `${Math.round(targetVideoKbps * 1.2)}k`,
      '-bufsize',
      `${Math.round(targetVideoKbps * 2)}k`
    );
  }

  // Audio codec: AAC, 128k, stereo or mono
  args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2');

  // FastStart: move moov atom before mdat for WhatsApp streaming & preview
  if (enableFastStart) {
    args.push('-movflags', '+faststart');
  }

  // Hard cap file size at 15.8MB (15800000 bytes) so it can never exceed 16MB
  if (compressTo16MB) {
    args.push('-fs', '15800000');
  }

  args.push('-y', outputName);

  const commandStr = `ffmpeg ${args.join(' ')}`;
  onProgress?.(30, '开始执行转码 (注入 FastStart 并强制 ≤16MB)...');

  await ffmpeg.exec(args);

  onProgress?.(96, '正在读取并封装转码后的 MP4 文件...');
  let data = await ffmpeg.readFile(outputName);
  let rawBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  // Secondary Fallback Guard: If output STILL exceeds 16MB (e.g. extreme bitrate overshoot)
  if (rawBytes.byteLength > 16 * 1024 * 1024) {
    onProgress?.(70, '视频仍超出 16MB，正在执行二次深度紧缩转码...');
    const fallbackArgs = [
      '-i',
      outputName,
      '-c:v',
      'libx264',
      '-profile:v',
      profile,
      '-bf',
      '0',
      '-preset',
      'ultrafast',
      '-vf',
      'scale=min(854\\,iw):-2',
      '-b:v',
      '600k',
      '-maxrate',
      '700k',
      '-bufsize',
      '1200k',
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-movflags',
      '+faststart',
      '-fs',
      '15500000',
      '-y',
      'fallback_output.mp4',
    ];
    await ffmpeg.exec(fallbackArgs);
    data = await ffmpeg.readFile('fallback_output.mp4');
    rawBytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    try {
      await ffmpeg.deleteFile('fallback_output.mp4');
    } catch {}
  }

  const copyBuffer = new ArrayBuffer(rawBytes.byteLength);
  new Uint8Array(copyBuffer).set(rawBytes);
  const blob = new Blob([copyBuffer], { type: 'video/mp4' });

  // Clean up virtual fs
  try {
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch {
    // ignore cleanup errors
  }

  const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'video';
  const fileName = `${originalName}_whatsapp.mp4`;

  onProgress?.(100, '视频转码完成！体积严格控制在 16MB 以内。');

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    fileSize: blob.size,
    commandUsed: commandStr,
  };
}

export function getRecommendedFFmpegCommand(fileName: string, isOversized = false): string {
  const bitrate = isOversized ? '1200k' : '1800k';
  const maxrate = isOversized ? '1400k' : '2200k';
  return `ffmpeg -i "${fileName}" -c:v libx264 -profile:v main -bf 0 -preset medium -b:v ${bitrate} -maxrate ${maxrate} -bufsize 3000k -vf "scale=min(1280\\,iw):-2:flags=lanczos" -c:a aac -b:a 128k -ac 2 -movflags +faststart -fs 16000000 output.mp4`;
}
