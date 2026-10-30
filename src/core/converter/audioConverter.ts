import lamejs from 'lamejs';

export interface AudioConversionOptions {
  bitrateKbps?: number; // 64, 128, 192, default 128
  onProgress?: (progress: number) => void;
}

export interface ConvertedAudioResult {
  blob: Blob;
  url: string;
  fileName: string;
  fileSize: number;
  durationSeconds: number;
}

export async function convertToMp3(
  file: File | Blob,
  options: AudioConversionOptions = {}
): Promise<ConvertedAudioResult> {
  const { bitrateKbps = 128, onProgress } = options;

  onProgress?.(5);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(15);

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  const audioCtx = new AudioCtx();
  let audioBuffer: AudioBuffer;

  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  onProgress?.(30);

  const channels = Math.min(audioBuffer.numberOfChannels, 2); // mono or stereo
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;

  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : leftFloat;

  const leftInt16 = floatToInt16(leftFloat);
  const rightInt16 = channels > 1 ? floatToInt16(rightFloat) : leftInt16;

  onProgress?.(45);

  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrateKbps);
  const mp3Data: Int8Array[] = [];

  const sampleBlockSize = 1152;
  const totalBlocks = Math.ceil(numSamples / sampleBlockSize);

  for (let i = 0; i < numSamples; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = channels > 1 ? rightInt16.subarray(i, i + sampleBlockSize) : undefined;

    const mp3buf = channels === 1
      ? mp3encoder.encodeBuffer(leftChunk)
      : mp3encoder.encodeBuffer(leftChunk, rightChunk);

    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    if (i % (sampleBlockSize * 20) === 0 && onProgress) {
      const currentBlock = Math.floor(i / sampleBlockSize);
      const prog = 45 + Math.round((currentBlock / totalBlocks) * 50);
      onProgress(Math.min(95, prog));
    }
  }

  const mp3End = mp3encoder.flush();
  if (mp3End.length > 0) {
    mp3Data.push(mp3End);
  }

  onProgress?.(98);

  const blob = new Blob(mp3Data as BlobPart[], { type: 'audio/mpeg' });
  const originalName = (file as File).name ? (file as File).name.replace(/\.[^/.]+$/, '') : 'audio';
  const fileName = `${originalName}_whatsapp.mp3`;

  onProgress?.(100);

  return {
    blob,
    url: URL.createObjectURL(blob),
    fileName,
    fileSize: blob.size,
    durationSeconds: Math.round(audioBuffer.duration * 10) / 10,
  };
}

function floatToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}
