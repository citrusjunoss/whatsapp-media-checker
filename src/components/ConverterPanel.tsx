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
  Sparkles,
  Sliders,
  Video,
  Volume2,
  ImageIcon,
  Smile,
  AlertCircle,
  FileCheck2,
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
  // Determine available tabs based on category and fixes
  const isImageOrSticker = activeResult.detectedCategory === 'image' || activeResult.detectedCategory === 'sticker';
  const isAudio = activeResult.detectedCategory === 'audio';
  const isVideo = activeResult.detectedCategory === 'video';

  const defaultTab = initialTab || (
    isAudio ? 'audio' : isVideo ? 'video' : isImageOrSticker ? 'image' : 'image'
  );

  const [activeTab, setActiveTab] = useState<'image' | 'sticker' | 'audio' | 'video'>(
    defaultTab as any
  );

  // --- Image Converter State ---
  const [imageFormat, setImageFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [imageQuality, setImageQuality] = useState(0.85);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageResult, setImageResult] = useState<ConvertedImageResult | null>(null);

  // --- Sticker Generator State ---
  const [stickerFit, setStickerFit] = useState<'contain' | 'cover'>('contain');
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [stickerResult, setStickerResult] = useState<GeneratedStickerResult | null>(null);

  // --- Audio Converter State ---
  const [audioBitrate, setAudioBitrate] = useState<number>(128);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isConvertingAudio, setIsConvertingAudio] = useState(false);
  const [audioResult, setAudioResult] = useState<ConvertedAudioResult | null>(null);

  // --- Video Converter State ---
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStage, setVideoStage] = useState('');
  const [isConvertingVideo, setIsConvertingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<ConvertedVideoResult | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  // --- Handlers ---
  const handleCompressImage = async () => {
    setIsCompressingImage(true);
    try {
      const res = await convertAndCompressImage(file, {
        format: imageFormat,
        quality: imageQuality,
      });
      setImageResult(res);
    } catch (err) {
      alert('图片压缩失败：' + err);
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleGenerateSticker = async () => {
    setIsGeneratingSticker(true);
    try {
      const res = await generateSticker(file, {
        fit: stickerFit,
      });
      setStickerResult(res);
    } catch (err) {
      alert('贴纸生成失败：' + err);
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
    } catch (err) {
      alert('音频转换失败：' + err);
    } finally {
      setIsConvertingAudio(false);
    }
  };

  const handleConvertVideo = async () => {
    setIsConvertingVideo(true);
    setVideoProgress(0);
    setVideoStage('准备初始化 FFmpeg...');
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
    } catch (err) {
      alert('视频转码失败：' + err);
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              纯前端文件修复与转换工具箱
            </h3>
            <p className="text-[11px] text-slate-500">
              所有转码与压缩均在本地浏览器内完成，无隐私泄露风险
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl space-x-1 text-xs">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'image'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>图片压缩/格式</span>
          </button>

          <button
            onClick={() => setActiveTab('sticker')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'sticker'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>512×512 贴纸</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'audio'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>音频转 MP3</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'video'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>视频 H.264/FastStart</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Image Converter */}
      {activeTab === 'image' && (
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>
              支持任意图片转为标准 <strong>JPEG</strong> 或 <strong>PNG</strong>，并自动压缩至 5MB 以内。
            </span>
            <span className="text-slate-400">当前文件：{formatBytes(file.size)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                目标导出格式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImageFormat('image/jpeg')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    imageFormat === 'image/jpeg'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  JPEG / JPG (推荐，体积更小)
                </button>
                <button
                  type="button"
                  onClick={() => setImageFormat('image/png')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    imageFormat === 'image/png'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  PNG (保留透明通道)
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
                <span>导出画质压缩率</span>
                <span className="text-emerald-600 font-mono">{Math.round(imageQuality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={imageQuality}
                onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>极限压缩 (20%)</span>
                <span>标准推荐 (85%)</span>
                <span>最高画质 (100%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleCompressImage}
              disabled={isCompressingImage}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isCompressingImage ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>正在执行 Canvas 压缩...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>一键转换为合规图片 (≤ 5MB)</span>
                </>
              )}
            </button>

            {imageResult && (
              <div className="flex items-center space-x-3">
                <div className="text-right text-xs">
                  <div className="font-semibold text-emerald-700">
                    压缩后大小：{formatBytes(imageResult.fileSize)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    尺寸：{imageResult.width} × {imageResult.height} px
                  </div>
                </div>
                <a
                  href={imageResult.url}
                  download={imageResult.fileName}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>下载文件</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Sticker Generator */}
      {activeTab === 'sticker' && (
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600">
            自动将任意图片转换为 <strong>512 × 512 像素</strong>、<strong>WebP 格式</strong>、且体积严格 <strong>≤ 100 KB</strong> 的标准 WhatsApp 贴纸。
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                裁剪与填充方式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStickerFit('contain')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    stickerFit === 'contain'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  等比留白 (透明背景)
                </button>
                <button
                  type="button"
                  onClick={() => setStickerFit('cover')}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                    stickerFit === 'cover'
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  居中裁剪 (铺满 512×512)
                </button>
              </div>
            </div>

            <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Smile className="w-5 h-5 text-emerald-600 mr-2.5 flex-shrink-0" />
              <span>
                自动进行画质二分迭代，保证导出的 WebP 贴纸严格小于 Meta 规定的 100KB 静态限制。
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleGenerateSticker}
              disabled={isGeneratingSticker}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isGeneratingSticker ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>正在生成贴纸并压至 100KB...</span>
                </>
              ) : (
                <>
                  <Smile className="w-3.5 h-3.5" />
                  <span>一键生成 512×512 WebP 贴纸</span>
                </>
              )}
            </button>

            {stickerResult && (
              <div className="flex items-center space-x-3">
                <img
                  src={stickerResult.url}
                  alt="Sticker Preview"
                  className="w-10 h-10 rounded border border-slate-200 object-contain bg-slate-100"
                />
                <div className="text-right text-xs">
                  <div className="font-semibold text-emerald-700">
                    大小：{formatBytes(stickerResult.fileSize)} (≤ 100KB)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    规格：512 × 512 px (WebP)
                  </div>
                </div>
                <a
                  href={stickerResult.url}
                  download={stickerResult.fileName}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>下载贴纸</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Audio Converter */}
      {activeTab === 'audio' && (
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600">
            利用 Web Audio API 与前端 MP3 编码器，将任意 WAV、M4A、OGG 或非标音频转为 WhatsApp 完美兼容的 <strong>MP3 (MPEG Audio)</strong>。
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                MP3 输出比特率
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[64, 128, 192].map((br) => (
                  <button
                    key={br}
                    type="button"
                    onClick={() => setAudioBitrate(br)}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-all ${
                      audioBitrate === br
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800 font-semibold shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {br} kbps {br === 128 && '(标准推荐)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Volume2 className="w-5 h-5 text-emerald-600 mr-2.5 flex-shrink-0" />
              <span>
                128kbps 在语音与音乐场景下均具备极佳音质，且 10 分钟音频体积通常仅约 9MB（远低于 16MB 上限）。
              </span>
            </div>
          </div>

          {/* Audio progress bar */}
          {isConvertingAudio && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>正在重采样并编码 MP3...</span>
                <span>{audioProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 transition-all duration-150"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handleConvertAudio}
              disabled={isConvertingAudio}
              className="flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isConvertingAudio ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>正在编码 MP3 ({audioProgress}%)...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>一键转换为兼容 MP3 音频</span>
                </>
              )}
            </button>

            {audioResult && (
              <div className="flex items-center space-x-3">
                <div className="text-right text-xs">
                  <div className="font-semibold text-emerald-700">
                    大小：{formatBytes(audioResult.fileSize)} (≤ 16MB)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    时长：{audioResult.durationSeconds} 秒
                  </div>
                </div>
                <a
                  href={audioResult.url}
                  download={audioResult.fileName}
                  className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>下载 MP3</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Video FFmpeg */}
      {activeTab === 'video' && (
        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600">
            采用 WebAssembly 技术调用浏览器内置 <strong>FFmpeg</strong>。自动修复 <strong>H.264 视频编码</strong>、<strong>AAC 音频编码</strong>、注入 <strong>FastStart (moov 在前)</strong>，并将超标视频压缩至 <strong>16MB 以内</strong>。
          </div>

          {/* Desktop CLI Fallback banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Video className="w-3.5 h-3.5 text-slate-500" />
                <span>官方推荐的桌面 FFmpeg 命令行参数</span>
              </span>
              <button
                onClick={handleCopyCli}
                className="flex items-center space-x-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? '已复制' : '复制命令'}</span>
              </button>
            </div>
            <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap">
              {getRecommendedFFmpegCommand(file.name, file.size > 16 * 1024 * 1024)}
            </code>
          </div>

          {/* In-Browser Video Conversion */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-950">
                  方案二：直接在当前浏览器运行 WebAssembly FFmpeg
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  首次点击将按需下载 ~20MB WASM 核心（自动浏览器缓存），无需配置环境即可在本地完成转码与 FastStart 注入。
                </p>
              </div>
            </div>

            {isConvertingVideo && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-emerald-900 font-medium">
                  <span>{videoStage}</span>
                  <span>{videoProgress}%</span>
                </div>
                <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 transition-all duration-200"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleConvertVideo}
                disabled={isConvertingVideo}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
              >
                {isConvertingVideo ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>转码执行中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>在浏览器中一键转码/修复视频</span>
                  </>
                )}
              </button>

              {videoResult && (
                <div className="flex items-center space-x-3">
                  <div className="text-right text-xs">
                    <div className="font-semibold text-emerald-700">
                      大小：{formatBytes(videoResult.fileSize)} (≤ 16MB)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      格式：H.264 + AAC + FastStart
                    </div>
                  </div>
                  <a
                    href={videoResult.url}
                    download={videoResult.fileName}
                    className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>下载合规视频</span>
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
