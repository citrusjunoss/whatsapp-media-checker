import React, { useState, useEffect } from 'react';
import { CheckMode, ValidationResult } from '../core/rules';
import { validateMediaFile, formatBytes } from '../core/validator';
import { DropZone } from './DropZone';
import { InspectionResult } from './InspectionResult';
import { ConverterPanel } from './ConverterPanel';
import { ApiHelperPanel } from './ApiHelperPanel';
import {
  FileCheck,
  Layers,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Wrench,
  Terminal,
  FileCode,
  Sparkles,
  ArrowRight,
  FolderOpen,
  HelpCircle,
  Play,
  FileText,
  Volume2,
  ImageIcon,
  Video,
} from 'lucide-react';

interface FileToolsViewProps {
  onOpenRules: () => void;
}

export const FileToolsView: React.FC<FileToolsViewProps> = ({ onOpenRules }) => {
  const [mode, setMode] = useState<CheckMode>('template_header');
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFixTab, setActiveFixTab] = useState<string | undefined>(undefined);
  const [actionTab, setActionTab] = useState<'converter' | 'curl' | 'binary'>('converter');

  const runValidation = async (files: File[], targetMode: CheckMode) => {
    setIsProcessing(true);
    try {
      const newMap = new Map(fileMap);
      const newResults: ValidationResult[] = [...results];

      for (const file of files) {
        const res = await validateMediaFile(file, targetMode);
        newMap.set(res.id, file);
        // Replace existing by filename or append
        const existingIdx = newResults.findIndex((r) => r.fileName === file.name);
        if (existingIdx !== -1) {
          newResults[existingIdx] = res;
        } else {
          newResults.unshift(res);
        }
      }

      setFileMap(newMap);
      setResults(newResults);
      if (newResults.length > 0) {
        setSelectedId(newResults[0].id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    runValidation(selectedFiles, mode);
  };

  const handleModeChange = async (newMode: CheckMode) => {
    setMode(newMode);
    if (results.length > 0) {
      const currentFiles = Array.from(fileMap.values());
      runValidation(currentFiles, newMode);
    }
  };

  const handleSelectFix = (fix: string) => {
    if (fix === 'compress_image') setActiveFixTab('image');
    else if (fix === 'make_sticker') setActiveFixTab('sticker');
    else if (fix === 'convert_audio_mp3') setActiveFixTab('audio');
    else if (fix === 'transcode_video_ffmpeg' || fix === 'fix_faststart') setActiveFixTab('video');
    else setActiveFixTab('image');

    setActionTab('converter');
    // Smooth micro-scroll to action console inside right pane
    document.getElementById('action-console-section')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  // Keyboard navigation: ArrowUp and ArrowDown to switch selected file in queue
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (results.length <= 1) return;

      const currentIndex = results.findIndex((r) => r.id === selectedId);
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % results.length;
        setSelectedId(results[nextIndex].id);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + results.length) % results.length;
        setSelectedId(results[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedId]);

  const activeResult = results.find((r) => r.id === selectedId) || results[0];
  const activeFile = activeResult ? fileMap.get(activeResult.id) : undefined;

  const handleClear = () => {
    setFileMap(new Map());
    setResults([]);
    setSelectedId(null);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedMap = new Map(fileMap);
    updatedMap.delete(id);
    const updatedResults = results.filter((r) => r.id !== id);
    setFileMap(updatedMap);
    setResults(updatedResults);
    if (selectedId === id) {
      setSelectedId(updatedResults.length > 0 ? updatedResults[0].id : null);
    }
  };

  // 1-Click quick test presets generator
  const handleQuickPreset = (type: 'valid_jpg' | 'sticker_512' | 'invalid_docx' | 'remote_sample_mp4') => {
    if (type === 'valid_jpg') {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, 1200, 630);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WhatsApp Valid Header (1200x630)', 600, 315);
      ctx.font = '22px monospace';
      ctx.fillText('JPEG · FastStart Compliant · < 5MB', 600, 360);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_header_compliant.jpg', { type: 'image/jpeg' });
          handleFilesSelected([file]);
        }
      }, 'image/jpeg', 0.9);
    } else if (type === 'sticker_512') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(256, 256, 210, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('512×512', 256, 270);
      ctx.font = '24px monospace';
      ctx.fillText('WebP Sticker', 256, 320);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_sticker_512.webp', { type: 'image/webp' });
          handleFilesSelected([file]);
        }
      }, 'image/webp', 0.85);
    } else if (type === 'invalid_docx') {
      const blob = new Blob(['Mock Office Document Header payload'], { type: 'application/msword' });
      const file = new File([blob], 'unsupported_contract.docx', { type: 'application/msword' });
      handleFilesSelected([file]);
    } else if (type === 'remote_sample_mp4') {
      // Small valid sample MP4 from Mozilla/W3C
      fetch('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4')
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], 'sample_video_15mb.mp4', { type: 'video/mp4' });
          handleFilesSelected([file]);
        })
        .catch(() => {
          // Fallback minimal mock
          const blob = new Blob([new Uint8Array(1024 * 1024 * 18)], { type: 'video/mp4' });
          const file = new File([blob], 'oversize_video_18mb.mp4', { type: 'video/mp4' });
          handleFilesSelected([file]);
        });
    }
  };

  return (
    <div className="space-y-4">
      {/* Precision Mode Selector Toolbar */}
      <div className="app-surface rounded-lg border app-border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md app-surface-subtle border app-border flex items-center justify-center flex-shrink-0">
            {mode === 'template_header' ? (
              <Layers className="w-4 h-4 text-emerald-500" />
            ) : (
              <FileCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase tracking-wider app-text-dim">
                API_GATEWAY_MODE:
              </span>
              <span className="text-sm font-bold app-text-main font-mono">
                {mode === 'template_header' ? '模板 Header 媒体检测 (/uploads)' : '标准媒体消息模式 (/media)'}
              </span>
            </div>
            <p className="text-xs app-text-muted mt-0.5 font-mono">
              {mode === 'template_header'
                ? '严格对齐 Graph API Resumable Upload 规范（仅支持 JPG/PNG/MP4/PDF，严禁音频/贴纸/3GP/Office）'
                : '对齐 Cloud API 标准媒体消息发送规范（支持图片、MP4/3GP 视频、音频、文档与 WebP 贴纸）'}
            </p>
          </div>
        </div>

        {/* Mode Segment Switches & Rule Reference Trigger */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center app-surface-subtle p-0.5 rounded-md border app-border">
            <button
              onClick={() => handleModeChange('standard')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                mode === 'standard'
                  ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                  : 'app-text-muted hover:app-text-main'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>标准模式</span>
            </button>

            <button
              onClick={() => handleModeChange('template_header')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                mode === 'template_header'
                  ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                  : 'app-text-muted hover:app-text-main'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>模板 Header</span>
            </button>
          </div>

          <button
            onClick={onOpenRules}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono app-surface-subtle border app-border app-text-muted hover:app-text-main transition-colors"
            title="查看 Meta 官方多媒体限制白皮书"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">规范表</span>
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANE (lg:col-span-4 / Input & File Queue) */}
        <div className="lg:col-span-4 space-y-3.5 min-w-0">
          {/* Quick 1-Click Test Presets */}
          <div className="app-surface rounded-lg border app-border p-3 space-y-2 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="app-text-dim uppercase text-[11px] font-semibold flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>1-CLICK_TEST_PRESETS (即测样本)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => handleQuickPreset('valid_jpg')}
                className="p-1.5 rounded app-surface-subtle hover:app-surface-hover border app-border text-left truncate flex items-center space-x-1.5 transition-colors"
                title="合规 1200x630 JPEG 图片"
              >
                <span>🖼️</span>
                <span className="truncate">合规 JPG 模板</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('sticker_512')}
                className="p-1.5 rounded app-surface-subtle hover:app-surface-hover border app-border text-left truncate flex items-center space-x-1.5 transition-colors"
                title="合规 512x512 WebP 贴纸"
              >
                <span>🏷️</span>
                <span className="truncate">512×512 贴纸</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('remote_sample_mp4')}
                className="p-1.5 rounded app-surface-subtle hover:app-surface-hover border app-border text-left truncate flex items-center space-x-1.5 transition-colors"
                title="真实 MP4 视频样例"
              >
                <span>🎥</span>
                <span className="truncate">MP4 视频流</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('invalid_docx')}
                className="p-1.5 rounded app-surface-subtle hover:app-surface-hover border app-border text-left truncate flex items-center space-x-1.5 transition-colors text-rose-500"
                title="模板 Header 禁用的 DOCX 文件"
              >
                <span>❌</span>
                <span className="truncate">非法 DOCX 测试</span>
              </button>
            </div>
          </div>

          {/* Compact DropZone */}
          <div className="app-surface rounded-lg border app-border p-3 transition-colors">
            <DropZone
              mode={mode}
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
            />
          </div>

          {/* File Queue / Session List */}
          <div className="app-surface rounded-lg border app-border p-3 space-y-2.5 transition-colors">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold app-text-main">
                  SESSION_QUEUE ({results.length})
                </span>
              </div>

              {results.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] app-text-dim hidden sm:inline">
                    <kbd className="kbd-shortcut">↑</kbd><kbd className="kbd-shortcut ml-0.5">↓</kbd> 切换
                  </span>
                  <button
                    onClick={handleClear}
                    className="flex items-center space-x-1 px-1.5 py-0.5 text-[10px] font-mono text-rose-500 hover:text-rose-400 app-surface rounded border app-border transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>清空</span>
                  </button>
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono app-text-dim border border-dashed app-border rounded">
                <div>暂无待检视文件</div>
                <div className="text-[10px] text-zinc-500 mt-1">拖拽或点击上方样本载入</div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
                {results.map((r) => {
                  const isSelected = r.id === activeResult?.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`p-2.5 rounded-md border text-xs font-mono cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'app-surface-subtle border-emerald-500/80 shadow-xs ring-1 ring-emerald-500/20'
                          : 'app-surface app-border hover:app-surface-subtle'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {r.overallStatus === 'pass' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                        {r.overallStatus === 'warning' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        {r.overallStatus === 'error' && (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        )}

                        <div className="min-w-0">
                          <div className="font-semibold app-text-main truncate max-w-[170px]" title={r.fileName}>
                            {r.fileName}
                          </div>
                          <div className="text-[10px] app-text-dim flex items-center space-x-1.5 mt-0.5">
                            <span>{formatBytes(r.fileSize)}</span>
                            <span>·</span>
                            <span className="uppercase">{r.detectedCategory}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {isSelected && (
                          <span className="kbd-shortcut text-[9px] text-emerald-500 border-emerald-500/30">
                            ACTIVE
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(r.id, e)}
                          className="p-1 text-zinc-500 hover:text-rose-500 transition-colors rounded"
                          title="从队列中移除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE (lg:col-span-8 / Inspector & Action Workbench) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {activeResult && activeFile ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Comprehensive Inspection Matrix & Live Player */}
              <InspectionResult
                result={activeResult}
                file={activeFile}
                onSelectFix={handleSelectFix}
              />

              {/* Action Console (Tabbed Workbench) */}
              <div
                id="action-console-section"
                className="app-surface rounded-lg border app-border overflow-hidden transition-colors shadow-xs"
              >
                {/* Action Console Tabs Header */}
                <div className="px-3.5 py-2.5 border-b app-border app-surface-subtle flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 text-xs font-mono">
                    <button
                      onClick={() => setActionTab('converter')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                        actionTab === 'converter'
                          ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                          : 'app-text-muted hover:app-text-main'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                      <span>智能转码修复 (Converter)</span>
                    </button>

                    <button
                      onClick={() => setActionTab('curl')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                        actionTab === 'curl'
                          ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                          : 'app-text-muted hover:app-text-main'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 text-blue-500" />
                      <span>API cURL 生成器</span>
                    </button>

                    <button
                      onClick={() => setActionTab('binary')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition-all ${
                        actionTab === 'binary'
                          ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                          : 'app-text-muted hover:app-text-main'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5 text-purple-500" />
                      <span>二进制 Box 探测</span>
                    </button>
                  </div>

                  <span className="text-[11px] font-mono app-text-dim hidden sm:inline">
                    WORKSPACE_COLLABORATION
                  </span>
                </div>

                {/* Tab 1: Converter */}
                {actionTab === 'converter' && (
                  <div className="p-3.5">
                    <ConverterPanel
                      activeResult={activeResult}
                      file={activeFile}
                      initialTab={activeFixTab}
                    />
                  </div>
                )}

                {/* Tab 2: cURL Api Helper */}
                {actionTab === 'curl' && (
                  <div className="p-3.5">
                    <ApiHelperPanel activeResult={activeResult} />
                  </div>
                )}

                {/* Tab 3: Binary Box / Sniff Inspector */}
                {actionTab === 'binary' && (
                  <div className="p-3.5 space-y-3 font-mono text-xs">
                    <div className="p-3 rounded bg-black/20 border app-border space-y-2">
                      <div className="font-bold app-text-main flex items-center justify-between">
                        <span>MP4 / MAGIC BYTES SNIFFER LOGS</span>
                        <span className="text-[10px] app-text-dim">ZERO_DEPENDENCY_PARSER</span>
                      </div>
                      <div className="text-[11px] app-text-muted space-y-1">
                        <div>文件名: {activeResult.fileName}</div>
                        <div>检测到的实际格式: {activeResult.detectedMime}</div>
                        <div>文件扩展名: {activeResult.fileName.split('.').pop() || 'N/A'}</div>
                        <div>FastStart (moov &lt; mdat): {activeResult.metadata?.hasFastStart ? 'YES (符合即时播放流)' : 'NO (需重排 moov box)'}</div>
                        <div>视频封装格式: {activeResult.metadata?.videoCodec || 'N/A'}</div>
                        <div>音频编码: {activeResult.metadata?.audioCodec || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded border app-border app-surface-subtle">
                      <div className="font-semibold app-text-main mb-1">💡 优化建议:</div>
                      <p className="app-text-muted text-[11px] leading-relaxed">
                        Meta WhatsApp 要求 MP4 视频采用 <code>moov</code> Atom 置于 <code>mdat</code> 之前（FastStart 机制）。若处于后置，收件人在视频全部下载前将无法开始流式播放。您可使用左侧第一个 Tab 的一键转码器无损注入 FastStart。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="app-surface rounded-lg border app-border p-12 text-center space-y-3 transition-colors shadow-xs">
              <div className="w-12 h-12 rounded-full app-surface-subtle border app-border flex items-center justify-center mx-auto text-emerald-500">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold app-text-main">
                  AWAITING_MEDIA_ASSETS
                </h3>
                <p className="text-xs app-text-dim max-w-md mx-auto mt-1 font-mono">
                  从左侧拖拽本地音视频、输入公开直链 URL，或点击左侧的【1-CLICK 即测样本】快速体验
                </p>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleQuickPreset('valid_jpg')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>立即载入测试样本</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
