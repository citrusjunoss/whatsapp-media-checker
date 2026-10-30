import React, { useState } from 'react';
import {
  ValidationResult,
  formatBytes,
} from '../core/validator';
import {
  convertAndCompressImage,
  ConvertedImageResult,
} from '../core/converter/imageConverter';
import {
  generateSticker,
  GeneratedStickerResult,
} from '../core/converter/stickerGenerator';
import {
  convertToMp3,
  ConvertedAudioResult,
} from '../core/converter/audioConverter';
import {
  convertVideo,
  ConvertedVideoResult,
  getRecommendedFFmpegCommand,
} from '../core/converter/videoConverter';
import {
  Wrench,
  Download,
  Copy,
  Check,
  Video,
  Volume2,
  ImageIcon,
  Smile,
  Loader2,
} from 'lucide-react';

interface ConverterPanelProps {
  activeResult: ValidationResult;
  file: File;
  initialTab?: string;
}

export const ConverterPanel: React.FC<ConverterPanelProps> = ({
  activeResult,
  file,
  initialTab,
}) => {
  const isImageOrSticker = activeResult.detectedCategory === 'image' || activeResult.detectedCategory === 'sticker';
  const isAudio = activeResult.detectedCategory === 'audio';
  const isVideo = activeResult.detectedCategory === 'video';

  const defaultTab = initialTab || (
    isAudio ? 'audio' : isVideo ? 'video' : isImageOrSticker ? 'image' : 'image'
  );

  const [activeTab, setActiveTab] = useState<'image' | 'sticker' | 'audio' | 'video'>(
    defaultTab as any
  );

  // Image Converter State
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [imageQuality, setImageQuality] = useState(0.85);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageResult, setImageResult] = useState<ConvertedImageResult | null>(null);

  // Sticker Generator State
  const [stickerFit, setStickerFit] = useState<'contain' | 'cover'>('contain');
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [stickerResult, setStickerResult] = useState<GeneratedStickerResult | null>(null);

  // Audio Converter State
  const [audioBitrate, setAudioBitrate] = useState<number>(128);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioResult, setAudioResult] = useState<ConvertedAudioResult | null>(null);

  // Video Converter State
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStage, setVideoStage] = useState('');
  const [isConvertingVideo, setIsConvertingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<ConvertedVideoResult | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  const handleCompressImage = async () => {
    setIsCompressingImage(true);
    try {
      const res = await convertAndCompressImage(file, {
        format: imageFormat,
        quality: imageQuality,
      });
      setImageResult(res);
    } catch (err: any) {
      alert('图片压缩失败：' + err.message);
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleGenerateSticker = async () => {
    setIsGeneratingSticker(true);
    try {
      const res = await generateSticker(file, { fit: stickerFit });
      setStickerResult(res);
    } catch (err: any) {
      alert('贴纸生成失败：' + err.message);
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handleConvertAudio = async () => {
    setIsConvertingAudio(true);
    setAudioProgress(0);
    try {
      const res = await convertToMp3(file, {
        bitrateKbps: audioBitrate,
        onProgress: (p) => setAudioProgress(p),
      });
      setAudioResult(res);
    } catch (err: any) {
      alert('音频转换失败：' + err.message);
    } finally {
      setIsConvertingAudio(false);
    }
  };

  const handleConvertVideo = async () => {
    setIsConvertingVideo(true);
    setVideoProgress(0);
    setVideoStage('INITIALIZING_WASM...');
    try {
      const res = await convertVideo(file, {
        enableFastStart: true,
        compressTo16MB: true,
        onProgress: (p, msg) => {
          setVideoProgress(p);
          setVideoStage(msg);
        },
      });
      setVideoResult(res);
    } catch (err: any) {
      alert('视频转码失败：' + err.message);
    } finally {
      setIsConvertingVideo(false);
    }
  };

  const handleCopyCli = () => {
    const cmd = getRecommendedFFmpegCommand(file.name, file.size > 16 * 1024 * 1024);
    navigator.clipboard.writeText(cmd);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="app-surface rounded-lg border app-border overflow-hidden transition-colors">
      {/* Header Strip */}
      <div className="p-3 border-b app-border app-surface-subtle flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold font-mono app-text-main">
            CLIENT_REPAIR_TOOLKIT
          </span>
          <span className="text-[11px] font-mono app-text-dim hidden sm:inline">
            (WebAssembly / Canvas / WebAudio)
          </span>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center app-surface p-0.5 rounded-md border app-border space-x-1 text-xs font-mono">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
              activeTab === 'image'
                ? 'app-surface-subtle app-text-main font-semibold border app-border'
                : 'app-text-dim hover:app-text-muted'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>IMAGE_COMPRESS</span>
          </button>

          <button
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
              activeTab === 'sticker'
                ? 'app-surface-subtle app-text-main font-semibold border app-border'
                : 'app-text-dim hover:app-text-muted'
            }`}
          >
            <Smile className="w-3 h-3" />
            <span>STICKER_512</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
              activeTab === 'audio'
                ? 'app-surface-subtle app-text-main font-semibold border app-border'
                : 'app-text-dim hover:app-text-muted'
            }`}
          >
            <Volume2 className="w-3 h-3" />
            <span>AUDIO_MP3</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
              activeTab === 'video'
                ? 'app-surface-subtle app-text-main font-semibold border app-border'
                : 'app-text-dim hover:app-text-muted'
            }`}
          >
            <Video className="w-3 h-3" />
            <span>VIDEO_FFMPEG</span>
          </button>
        </div>
      </div>

      {/* Tab: Image Converter */}
      {activeTab === 'image' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between app-text-dim text-[11px]">
            <span>FORMAT: JPG / PNG (AUTO RESIZE &amp; COMPRESS ≤ 5MB)</span>
            <span>SRC_SIZE: {formatBytes(file.size)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] app-text-dim mb-1">TARGET_FORMAT</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setImageFormat('image/jpeg')}
                  className={`py-1.5 px-2.5 rounded border text-center transition-all ${
                    imageFormat === 'image/jpeg'
                      ? 'app-surface-subtle text-emerald-500 border-emerald-500/50 font-bold'
                      : 'app-surface app-border app-text-muted hover:app-text-main'
                  }`}
                >
                  JPEG / JPG
                </button>
                <button
                  type="button"
                  onClick={() => setImageFormat('image/png')}
                  className={`py-1.5 px-2.5 rounded border text-center transition-all ${
                    imageFormat === 'image/png'
                      ? 'app-surface-subtle text-emerald-500 border-emerald-500/50 font-bold'
                      : 'app-surface app-border app-text-muted hover:app-text-main'
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] app-text-dim mb-1">
                <span>QUALITY_BUDGET</span>
                <span className="text-emerald-500">{Math.round(imageQuality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t app-border">
            <button
              onClick={handleCompressImage}
              disabled={isCompressingImage}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5"
            >
              {isCompressingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>COMPRESSING...</span>
                </>
              ) : (
                <span>EXECUTE_COMPRESS (≤ 5MB)</span>
              )}
            </button>

            {imageResult && (
              <div className="flex items-center space-x-3">
                <div className="text-right text-[11px]">
                  <div className="text-emerald-500 font-bold">
                    RESULT: {formatBytes(imageResult.fileSize)}
                  </div>
                  <div className="app-text-dim">
                    {imageResult.width}×{imageResult.height} px
                  </div>
                </div>
                <a
                  href={imageResult.url}
                  download={imageResult.fileName}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Sticker Generator */}
      {activeTab === 'sticker' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div className="app-text-dim text-[11px]">
            SPEC: EXACT 512×512 PX · WEBP FORMAT · STATIC ≤ 100 KB
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] app-text-dim mb-1">FIT_MODE</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStickerFit('contain')}
                  className={`py-1.5 px-2.5 rounded border text-center transition-all ${
                    stickerFit === 'contain'
                      ? 'app-surface-subtle text-emerald-500 border-emerald-500/50 font-bold'
                      : 'app-surface app-border app-text-muted hover:app-text-main'
                  }`}
                >
                  CONTAIN (TRANSPARENT)
                </button>
                <button
                  type="button"
                  onClick={() => setStickerFit('cover')}
                  className={`py-1.5 px-2.5 rounded border text-center transition-all ${
                    stickerFit === 'cover'
                      ? 'app-surface-subtle text-emerald-500 border-emerald-500/50 font-bold'
                      : 'app-surface app-border app-text-muted hover:app-text-main'
                  }`}
                >
                  COVER (CROP_512)
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded border app-border app-surface-subtle text-[11px] app-text-dim leading-relaxed">
              Auto-iterates quality compression until output is strictly under 100 KB limit.
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t app-border">
            <button
              onClick={handleGenerateSticker}
              disabled={isGeneratingSticker}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5"
            >
              {isGeneratingSticker ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>GENERATING...</span>
                </>
              ) : (
                <span>GENERATE_STICKER_512</span>
              )}
            </button>

            {stickerResult && (
              <div className="flex items-center space-x-3">
                <img
                  src={stickerResult.url}
                  alt="Sticker Preview"
                  className="w-8 h-8 rounded border app-border object-contain app-surface-subtle"
                />
                <div className="text-right text-[11px]">
                  <div className="text-emerald-500 font-bold">
                    {formatBytes(stickerResult.fileSize)} (≤ 100KB)
                  </div>
                </div>
                <a
                  href={stickerResult.url}
                  download={stickerResult.fileName}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Audio Converter */}
      {activeTab === 'audio' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          <div className="app-text-dim text-[11px]">
            SPEC: RE-ENCODE AUDIO TO WHATSAPP STANDARD MP3 (128 KBPS)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] app-text-dim mb-1">BITRATE</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[64, 128, 192].map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => setAudioBitrate(br)}
                    className={`py-1.5 px-2 rounded border text-center transition-all ${
                      audioBitrate === br
                        ? 'app-surface-subtle text-emerald-500 border-emerald-500/50 font-bold'
                        : 'app-surface app-border app-text-muted hover:app-text-main'
                    }`}
                  >
                    {br}k
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded border app-border app-surface-subtle text-[11px] app-text-dim">
              Uses Web Audio API float-to-int16 decimation and client-side LAME encoder.
            </div>
          </div>

          {isConvertingAudio && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] app-text-dim">
                <span>ENCODING_MP3...</span>
                <span>{audioProgress}%</span>
              </div>
              <div className="w-full app-surface-subtle h-1.5 rounded overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 transition-all duration-100"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t app-border">
            <button
              onClick={handleConvertAudio}
              disabled={isConvertingAudio}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5"
            >
              {isConvertingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>ENCODING...</span>
                </>
              ) : (
                <span>CONVERT_TO_MP3</span>
              )}
            </button>

            {audioResult && (
              <div className="flex items-center space-x-3">
                <div className="text-right text-[11px]">
                  <div className="text-emerald-500 font-bold">
                    {formatBytes(audioResult.fileSize)}
                  </div>
                  <div className="app-text-dim">{audioResult.durationSeconds}s</div>
                </div>
                <a
                  href={audioResult.url}
                  download={audioResult.fileName}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Video FFmpeg */}
      {activeTab === 'video' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          {/* CLI Fallback */}
          <div className="p-3 rounded border app-border app-surface-subtle space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] app-text-dim">OFFICIAL_FFMPEG_CLI_COMMAND</span>
              <button
                onClick={handleCopyCli}
                className="flex items-center space-x-1 text-emerald-500 hover:text-emerald-400 text-[11px]"
              >
                {copiedCli ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCli ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>
            <pre className="app-code-bg p-2 rounded text-[11px] app-text-muted overflow-x-auto whitespace-pre-wrap">
              {getRecommendedFFmpegCommand(file.name, file.size > 16 * 1024 * 1024)}
            </pre>
          </div>

          {/* In-Browser WASM */}
          <div className="p-3 rounded border app-border app-surface-subtle space-y-3">
            <div className="text-[11px] app-text-dim">
              IN_BROWSER_WASM: H.264 + AAC + FASTSTART (≤ 16MB)
            </div>

            {isConvertingVideo && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-emerald-500">
                  <span>&gt; {videoStage}</span>
                  <span>{videoProgress}%</span>
                </div>
                <div className="w-full app-code-bg h-1.5 rounded overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 transition-all duration-150"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={handleConvertVideo}
                disabled={isConvertingVideo}
                className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5"
              >
                {isConvertingVideo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <span>RUN_FFMPEG_IN_BROWSER</span>
                )}
              </button>

              {videoResult && (
                <div className="flex items-center space-x-3">
                  <div className="text-right text-[11px]">
                    <div className="text-emerald-500 font-bold">
                      {formatBytes(videoResult.fileSize)}
                    </div>
                  </div>
                  <a
                    href={videoResult.url}
                    download={videoResult.fileName}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>DOWNLOAD</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
