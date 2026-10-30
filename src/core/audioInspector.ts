/**
 * Inspect audio files using Web Audio API
 */

export interface AudioInspectionResult {
  durationSeconds?: number;
  channels?: number;
  sampleRate?: number;
  isValidAudio: boolean;
  estimatedBitrateKbps?: number;
}

export async function inspectAudio(file: File): Promise<AudioInspectionResult> {
  const result: AudioInspectionResult = {
    isValidAudio: false,
  };

  try {
    if (typeof window === 'undefined') {
      return result;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      return result;
    }

    const arrayBuffer = await file.arrayBuffer();
    const ctx = new AudioCtx();
    try {
      // Decode slice or full buffer
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      result.isValidAudio = true;
      result.durationSeconds = Math.round(audioBuffer.duration * 10) / 10;
      result.channels = audioBuffer.numberOfChannels;
      result.sampleRate = audioBuffer.sampleRate;

      if (result.durationSeconds > 0) {
        // file size in bits / duration / 1000
        result.estimatedBitrateKbps = Math.round((file.size * 8) / (result.durationSeconds * 1000));
      }
    } finally {
      await ctx.close();
    }
  } catch (err) {
    // If decode fails (e.g. unsupported raw AMR in some browsers), fallback gracefully
    console.warn('Audio decoding error:', err);
  }

  return result;
}
