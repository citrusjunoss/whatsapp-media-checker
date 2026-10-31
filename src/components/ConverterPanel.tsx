import React, { useState, useEffect } from 'react';
import {
  ValidationResult,
  formatBytes,
} from '../core/validator';
import {
  convertAndCompressImage,
  ConvertedImageResult,
  ImageCropRect,
} from '../core/converter/imageConverter';
import { ImageCropper, AspectRatioPreset } from './ImageCropper';
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
  Sparkles,
  FileText,
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
  // Determine effective media category strictly based on input file and inspection
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const detectedCat = activeResult.detectedCategory;

  let effectiveCategory: 'video' | 'audio' | 'image' | 'document' | 'unknown' = 'unknown';
  if (
    detectedCat === 'video' ||
    file.type.startsWith('video/') ||
    ['mp4', '3gp', 'mov', 'mkv', 'avi', 'webm', 'qt'].includes(ext)
  ) {
    effectiveCategory = 'video';
  } else if (
    detectedCat === 'audio' ||
    file.type.startsWith('audio/') ||
    ['mp3', 'aac', 'ogg', 'wav', 'm4a', 'opus', 'amr'].includes(ext)
  ) {
    effectiveCategory = 'audio';
  } else if (
    detectedCat === 'image' ||
    detectedCat === 'sticker' ||
    file.type.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)
  ) {
    effectiveCategory = 'image';
  } else if (
    detectedCat === 'document' ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)
  ) {
    effectiveCategory = 'document';
  }

  // Image sub-tool: either image compression/cropping OR 512x512 sticker
  const [imageSubTab, setImageSubTab] = useState<'image' | 'sticker'>(() => {
    return initialTab === 'sticker' || detectedCat === 'sticker' ? 'sticker' : 'image';
  });

  // Image Converter State
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [imageQuality, setImageQuality] = useState(0.85);
  const [cropRect, setCropRect] = useState<ImageCropRect | null>(null);
  const [currentPreset, setCurrentPreset] = useState<AspectRatioPreset>(
    activeResult.mode === 'template_header' ? '3:2' : '3:2'
  );
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
  const [videoProfile, setVideoProfile] = useState<'main' | 'baseline'>('main');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStage, setVideoStage] = useState('');
  const [isConvertingVideo, setIsConvertingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<ConvertedVideoResult | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  // Reset tool results when a new file or detection arrives
  useEffect(() => {
    setImageResult(null);
    setStickerResult(null);
    setAudioResult(null);
    setVideoResult(null);
    setCropRect(null);
    if (activeResult.detectedCategory === 'sticker') {
      setImageSubTab('sticker');
    } else {
      setImageSubTab('image');
    }
  }, [file, activeResult]);

  const handleCompressImage = async () => {
    setIsCompressingImage(true);
    try {
      const res = await convertAndCompressImage(file, {
        format: imageFormat,
        quality: imageQuality,
        crop: cropRect || undefined,
      });
      setImageResult(res);
    } catch (err: any) {
      alert('图片处理失败：' + err.message);
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
      alert('音频转码失败：' + err.message);
    } finally {
      setIsConvertingAudio(false);
    }
  };

  const handleConvertVideo = async () => {
    setIsConvertingVideo(true);
    setVideoProgress(0);
    setVideoStage('初始化 FFmpeg WebAssembly 运行环境...');
    try {
      const res = await convertVideo(file, {
        profile: videoProfile,
        enableFastStart: true,
        compressTo16MB: true,
        onProgress: (p: number, stage: string) => {
          setVideoProgress(p);
          setVideoStage(stage);
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
            {effectiveCategory === 'video' && '(WebAssembly FFmpeg · 视频兼容转码)'}
            {effectiveCategory === 'audio' && '(WebAudio / LameJS · 音频转码)'}
            {effectiveCategory === 'image' && '(Canvas 2D / WebP · 图片与贴纸工具)'}
            {effectiveCategory === 'document' && '(文档类型说明)'}
            {effectiveCategory === 'unknown' && '(格式探测)'}
          </span>
        </div>

        {/* Dynamic Mode / Tool Indicator (Strictly according to input media category) */}
        {effectiveCategory === 'video' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>VIDEO_FFMPEG</span>
          </div>
        )}

        {effectiveCategory === 'audio' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
            <Volume2 className="w-3.5 h-3.5" />
            <span>AUDIO_MP3</span>
          </div>
        )}

        {effectiveCategory === 'image' && (
          <div className="flex items-center app-surface p-0.5 rounded-md border app-border space-x-1 text-xs font-mono">
            <button
              onClick={() => setImageSubTab('image')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
                imageSubTab === 'image'
                  ? 'app-surface-subtle app-text-main font-semibold border app-border'
                  : 'app-text-dim hover:app-text-muted'
              }`}
            >
              <ImageIcon className="w-3 h-3" />
              <span>IMAGE_COMPRESS</span>
            </button>

            <button
              onClick={() => setImageSubTab('sticker')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-all ${
                imageSubTab === 'sticker'
                  ? 'app-surface-subtle app-text-main font-semibold border app-border'
                  : 'app-text-dim hover:app-text-muted'
              }`}
            >
              <Smile className="w-3 h-3" />
              <span>STICKER_512</span>
            </button>
          </div>
        )}

        {effectiveCategory === 'document' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#27272a] text-[#a1a1aa] border border-[#3f3f46] text-xs font-mono">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>DOCUMENT_INFO</span>
          </div>
        )}
      </div>

      {/* Case 1: Image Converter / Cropper */}
      {effectiveCategory === 'image' && imageSubTab === 'image' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          {/* Header Mode Notice */}
          {activeResult.mode === 'template_header' && (
            <div className="p-2.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 space-y-1">
              <div className="font-bold text-[11px] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>WHATSAPP 模板 HEADER 比例要求</span>
              </div>
              <p className="text-[11px] leading-relaxed text-emerald-300/90 font-sans">
                Meta 官方要求模板 Header 图片必须符合 <b>横版 3:2</b>、<b>方形 1:1</b> 或 <b>竖版 2:3</b>。请在下方选框中框选满意构图，系统将自动锁定合规比例并无损裁剪。
              </p>
            </div>
          )}

          {/* Interactive Visual Cropper with 3:2, 1:1, 2:3 Presets */}
          <ImageCropper
            file={file}
            defaultPreset={activeResult.mode === 'template_header' ? '3:2' : '3:2'}
            onCropChange={(crop, p) => {
              setCropRect(crop);
              setCurrentPreset(p);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t app-border">
            <button
              onClick={handleCompressImage}
              disabled={isCompressingImage}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors flex items-center space-x-1.5"
            >
              {isCompressingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <span>CROP_AND_OPTIMIZE (≤ 5MB)</span>
              )}
            </button>

            {imageResult && (
              <div className="flex items-center space-x-3">
                <div className="text-right text-[11px]">
                  <div className="text-emerald-500 font-bold flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{formatBytes(imageResult.fileSize)}</span>
                    <span className="text-[10px] text-emerald-400/80">(≤5MB 合规)</span>
                  </div>
                  <div className="app-text-dim">
                    {imageResult.width}×{imageResult.height} px
                  </div>
                </div>
                <a
                  href={imageResult.url}
                  download={imageResult.fileName}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors font-bold"
                >
                  <Download className="w-3 h-3" />
                  <span>DOWNLOAD</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Case 2: Image Sticker Generator */}
      {effectiveCategory === 'image' && imageSubTab === 'sticker' && (
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

      {/* Case 3: Audio Converter */}
      {effectiveCategory === 'audio' && (
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

      {/* Case 4: Video FFmpeg */}
      {effectiveCategory === 'video' && (
        <div className="p-4 space-y-4 font-mono text-xs">
          {/* Meta Official Specification Notice */}
          <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 space-y-1">
            <div className="font-bold text-[11px] flex items-center space-x-1.5">
              <span>META 官方视频兼容规范说明</span>
            </div>
            <p className="text-[11px] leading-relaxed text-emerald-300/90 font-sans">
              仅支持 H.264 视频与 AAC 音频（单音频轨或无音轨）。<b>Android WhatsApp 客户端不支持 H.264 High Profile 且含 B-frames 的视频</b>。Meta 官方推荐使用 <b>H.264 Main Profile 无 B-frames</b>，并添加 <code className="bg-black/30 px-1 py-0.5 rounded font-mono">-movflags +faststart</code> 优化，体积严格控制在 <b>≤16MB</b>。
            </p>
          </div>

          {/* Profile Selector */}
          <div>
            <label className="block text-[11px] app-text-dim mb-1.5 font-bold">
              H.264 ENCODING PROFILE (编码规格配置)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVideoProfile('main')}
                className={`p-2.5 rounded border text-left transition-all ${
                  videoProfile === 'main'
                    ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                    : 'app-surface app-border app-text-muted hover:app-text-main'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>H.264 Main Profile</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400">官方推荐</span>
                </div>
                <div className="text-[10px] font-normal app-text-dim mt-0.5">
                  -profile:v main -bf 0（移除 B-frames，适配 Android）
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVideoProfile('baseline')}
                className={`p-2.5 rounded border text-left transition-all ${
                  videoProfile === 'baseline'
                    ? 'app-surface-subtle text-emerald-400 border-emerald-500/50 font-bold shadow-xs'
                    : 'app-surface app-border app-text-muted hover:app-text-main'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>H.264 Baseline Profile</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">全机型通用</span>
                </div>
                <div className="text-[10px] font-normal app-text-dim mt-0.5">
                  -profile:v baseline -bf 0（旧款设备无障碍兼容）
                </div>
              </button>
            </div>
          </div>

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
            <div className="flex items-center justify-between text-[11px] app-text-dim">
              <span>IN_BROWSER_WASM: H.264 {videoProfile.toUpperCase()} + 无 B-frames + FASTSTART</span>
              <span className="text-emerald-500 font-bold">强制严格 ≤ 16MB</span>
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

            <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <div className="text-emerald-500 font-bold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{formatBytes(videoResult.fileSize)}</span>
                      <span className="text-[10px] text-emerald-400/80">(≤16MB 合规)</span>
                    </div>
                    <div className="text-[10px] app-text-dim">FastStart + No B-Frames</div>
                  </div>
                  <a
                    href={videoResult.url}
                    download={videoResult.fileName}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors font-bold"
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

      {/* Case 5: Document or Unknown Format */}
      {(effectiveCategory === 'document' || effectiveCategory === 'unknown') && (
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-300 space-y-2">
            <div className="font-bold text-xs flex items-center space-x-2 text-amber-400">
              <FileText className="w-4 h-4" />
              <span>文档类型暂不支持客户端自动化转码</span>
            </div>
            <p className="text-[12px] leading-relaxed font-sans text-slate-300">
              当前检测的文件属于文档类型（如 PDF、DOCX、XLSX、PPT 等）。
              WhatsApp 官方支持直接原样发送合规文档（标准发送模式上限 100MB；模板 Header 模式仅支持 ≤100MB 的标准 PDF）。
            </p>
            <div className="pt-2 border-t border-amber-500/20 text-[11px] font-sans text-slate-400 space-y-1">
              <div>• <b>合规文档无需转码</b>：若上方矩阵检测全绿通过，可直接通过 WhatsApp API 发送。</div>
              <div>• <b>若体积或格式超标</b>：纯前端暂未提供文档在线重排版/压缩工具，请在桌面办公软件（如 Microsoft Word、Adobe Acrobat、WPS 等）中压缩或另存导出为合规 PDF 后重新上传检测。</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
