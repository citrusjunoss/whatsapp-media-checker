import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  getLoadedErrorDataset,
  searchErrors,
  ERROR_CATEGORIES,
  POPULAR_ERROR_CODES,
  WhatsAppErrorItem,
  ErrorSeverity,
} from '../../core/errorEngine';
import {
  validateMediaFile,
  formatBytes,
  ValidationResult,
  CheckMode,
} from '../../core/validator';
import {
  Search,
  X,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  Clock,
  ServerCrash,
  Terminal,
  FileCode,
  CheckSquare,
  Square,
  Sparkles,
  Command,
  FileCheck,
  Upload,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useTheme } from '../../core/themeContext';

export const RaycastView: React.FC<{
  onOpenRules: () => void;
}> = ({ onOpenRules }) => {
  const { setTheme } = useTheme();
  const dataset = useMemo(() => getLoadedErrorDataset(), []);

  // Raycast view mode: 'errors' | 'media'
  const [viewMode, setViewMode] = useState<'errors' | 'media'>('errors');
  const [query, setQuery] = useState('');
  const [selectedErrorCode, setSelectedErrorCode] = useState<number>(131047);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, Record<number, boolean>>>({});

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaResult, setMediaResult] = useState<ValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkMode, setCheckMode] = useState<CheckMode>('standard');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global Raycast shortcuts: ⌘K to toggle mode, / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setViewMode((prev) => (prev === 'errors' ? 'media' : 'errors'));
        return;
      }

      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered errors
  const filteredErrors = useMemo(() => {
    return searchErrors(query, 'all', dataset.items);
  }, [query, dataset.items]);

  // Keep selected error valid
  useEffect(() => {
    if (viewMode === 'errors' && filteredErrors.length > 0) {
      if (!filteredErrors.some((i) => i.code === selectedErrorCode)) {
        setSelectedErrorCode(filteredErrors[0].code);
      }
    }
  }, [filteredErrors, selectedErrorCode, viewMode]);

  // Arrow navigation for Raycast list
  useEffect(() => {
    const handleArrowNav = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      } else if (document.activeElement === inputRef.current) {
        return;
      }

      if (viewMode === 'errors' && filteredErrors.length > 0) {
        const curIdx = filteredErrors.findIndex((i) => i.code === selectedErrorCode);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = curIdx < filteredErrors.length - 1 ? curIdx + 1 : 0;
          setSelectedErrorCode(filteredErrors[next].code);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = curIdx > 0 ? curIdx - 1 : filteredErrors.length - 1;
          setSelectedErrorCode(filteredErrors[prev].code);
        } else if (e.key === ' ' || e.key === 'Enter') {
          // Toggle first unchecked step
          const selected = filteredErrors.find((i) => i.code === selectedErrorCode);
          if (selected) {
            e.preventDefault();
            setCheckedSteps((prev) => {
              const current = prev[selected.code] || {};
              const nextState = !current[0];
              return {
                ...prev,
                [selected.code]: { ...current, 0: nextState },
              };
            });
          }
        }
      }
    };

    window.addEventListener('keydown', handleArrowNav);
    return () => window.removeEventListener('keydown', handleArrowNav);
  }, [viewMode, filteredErrors, selectedErrorCode]);

  // Scroll active into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedErrorCode]);

  // Media Inspection handler
  const handleInspect = async (file: File) => {
    setMediaFile(file);
    setIsChecking(true);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);

    try {
      const res = await validateMediaFile(file, checkMode);
      setMediaResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  // Generate 1-click test file presets
  const handlePreset = (type: 'jpg' | 'sticker' | 'docx') => {
    if (type === 'jpg') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px monospace';
      ctx.fillText('WhatsApp Valid JPG Sample', 40, 80);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], 'raycast_sample.jpg', { type: 'image/jpeg' });
          handleInspect(f);
        }
      }, 'image/jpeg', 0.9);
    } else if (type === 'sticker') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(256, 256, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WA STICKER', 256, 266);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], 'valid_sticker_512.webp', { type: 'image/webp' });
          handleInspect(f);
        }
      }, 'image/webp');
    } else {
      const f = new File(['[MOCK DOCX CORRUPTED]'], 'invalid_sample.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      handleInspect(f);
    }
  };

  const selectedItem = useMemo(() => {
    return dataset.items.find((i) => i.code === selectedErrorCode) || null;
  }, [dataset.items, selectedErrorCode]);

  const copyFeedback = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3 font-sans pb-16">
      {/* Raycast Command Window Container */}
      <div className="bg-[#141415] text-[#ededed] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Raycast Header Bar & Global Launcher Input */}
        <div className="p-3 border-b border-[#27272a] flex items-center justify-between gap-3 bg-[#18181b]/70">
          <div className="flex items-center space-x-2.5 flex-1">
            <div className="w-7 h-7 rounded-md bg-emerald-600/90 flex items-center justify-center text-white shadow-xs">
              <Command className="w-4 h-4" />
            </div>
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-[#71717a] absolute left-2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  viewMode === 'errors'
                    ? '搜索 77 个错误代码 (如 131047, 192) 或中英文症状...'
                    : 'Raycast 媒体检测：支持拖拽、快速预设或输入过滤...'
                }
                className="w-full bg-transparent pl-8 pr-12 py-1.5 text-xs font-mono text-[#ededed] placeholder:text-[#71717a] focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2 p-1 text-[#71717a] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('errors')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                viewMode === 'errors'
                  ? 'bg-[#27272a] text-emerald-400 font-semibold'
                  : 'text-[#a1a1aa] hover:text-[#ededed]'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>错误诊断 (77)</span>
            </button>
            <button
              onClick={() => setViewMode('media')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1.5 ${
                viewMode === 'media'
                  ? 'bg-[#27272a] text-emerald-400 font-semibold'
                  : 'text-[#a1a1aa] hover:text-[#ededed]'
              }`}
            >
              <FileCheck className="w-3 h-3" />
              <span>媒体工具 (Media)</span>
            </button>

            {/* Switch Theme Button */}
            <div className="border-l border-[#27272a] pl-2 flex items-center space-x-1">
              <button
                onClick={() => setTheme('stripe')}
                className="px-2 py-0.5 rounded text-[10px] bg-[#222225] hover:bg-[#2e2e33] text-slate-300"
                title="切换到 Stripe 模式"
              >
                Stripe
              </button>
              <button
                onClick={() => setTheme('github')}
                className="px-2 py-0.5 rounded text-[10px] bg-[#222225] hover:bg-[#2e2e33] text-slate-300"
                title="切换到 GitHub 模式"
              >
                GitHub
              </button>
            </div>
          </div>
        </div>

        {/* Raycast Dual-Pane Body */}
        {viewMode === 'errors' ? (
          <div className="grid grid-cols-12 divide-x divide-[#27272a] h-[580px]">
            {/* Left Column: Command List (5 cols) */}
            <div className="col-span-5 flex flex-col h-full bg-[#121214]">
              <div className="px-3 py-2 text-[10px] font-mono text-[#71717a] border-b border-[#27272a] flex justify-between">
                <span>ERROR COMMANDS</span>
                <span>{filteredErrors.length} ITEMS</span>
              </div>

              <div className="flex-1 overflow-y-auto dev-scrollbar p-1.5 space-y-1">
                {filteredErrors.map((item) => {
                  const isSelected = selectedErrorCode === item.code;
                  return (
                    <div
                      key={item.code}
                      ref={isSelected ? activeItemRef : null}
                      onClick={() => setSelectedErrorCode(item.code)}
                      className={`px-2.5 py-2 rounded-md text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-600/20 text-white border border-emerald-500/40 font-medium'
                          : 'text-[#a1a1aa] hover:bg-[#1f1f23] hover:text-[#ededed]'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono font-bold text-emerald-400">
                          #{item.code}
                        </span>
                        <span className="truncate">{item.titleZh}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1f1f23] text-[#71717a] shrink-0 ml-1">
                        {item.severity === 'blocker' ? 'BLOCK' : item.severity === 'rate_limit' ? 'RATE' : 'ERR'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: QuickLook Inspector (7 cols) */}
            <div className="col-span-7 flex flex-col h-full bg-[#161618] overflow-y-auto dev-scrollbar p-5 space-y-4">
              {selectedItem ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-mono font-black text-emerald-400">
                          #{selectedItem.code}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272a] text-slate-300">
                          HTTP {selectedItem.httpStatus || 400}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272a] text-emerald-400">
                          {selectedItem.categoryNameZh}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-white mt-1">
                        {selectedItem.titleZh}
                      </h2>
                      <div className="text-xs font-mono text-[#71717a]">
                        {selectedItem.titleEn}
                      </div>
                    </div>

                    <a
                      href={selectedItem.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-emerald-400 hover:underline flex items-center space-x-1"
                    >
                      <span>Meta Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Diagnosis */}
                  <div className="p-3.5 rounded-lg bg-[#1f1f23] border border-[#2d2d32] space-y-1 text-xs">
                    <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase">
                      业务原因剖析 (Root Cause)
                    </div>
                    <p className="text-[#d4d4d8] leading-relaxed">
                      {selectedItem.detailsZh}
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="p-3.5 rounded-lg bg-[#1f1f23] border border-[#2d2d32] space-y-2.5 text-xs">
                    <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase flex justify-between">
                      <span>行动项清单 (Action Checklist)</span>
                      <span className="text-[#71717a]">按空格或回车标记完成</span>
                    </div>

                    {selectedItem.solutionZh
                      .split(/(?:\r?\n|;|；)/)
                      .map((s) => s.trim())
                      .filter((s) => s.length > 2)
                      .map((step, idx) => {
                        const isDone = !!checkedSteps[selectedItem.code]?.[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCheckedSteps((prev) => ({
                                ...prev,
                                [selectedItem.code]: {
                                  ...(prev[selectedItem.code] || {}),
                                  [idx]: !prev[selectedItem.code]?.[idx],
                                },
                              }));
                            }}
                            className={`flex items-start space-x-2 p-2 rounded cursor-pointer transition-colors ${
                              isDone
                                ? 'bg-emerald-500/10 line-through text-[#71717a]'
                                : 'bg-[#18181b] text-[#ededed] hover:bg-[#27272a]'
                            }`}
                          >
                            <button className="shrink-0 mt-0.5 text-emerald-400">
                              {isDone ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                            <span className="leading-snug">{step}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Simulated Payload */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-[11px] text-[#71717a]">
                      <span>GRAPH API WEBHOOK PAYLOAD</span>
                      <button
                        onClick={() =>
                          copyFeedback(
                            selectedItem.examplePayload ||
                              JSON.stringify({ error: { code: selectedItem.code, message: selectedItem.titleEn } }, null, 2),
                            'payload'
                          )
                        }
                        className="text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        {copiedText === 'payload' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedText === 'payload' ? '已复制' : '复制 JSON'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0d0d0e] border border-[#27272a] text-[#a1a1aa] overflow-x-auto text-[11px] leading-relaxed">
                      {selectedItem.examplePayload ||
                        JSON.stringify(
                          {
                            error: {
                              message: `(#${selectedItem.code}) ${selectedItem.titleEn}`,
                              type: selectedItem.severity === 'rate_limit' ? 'OAuthException' : 'GraphMethodException',
                              code: selectedItem.code,
                              error_user_title: selectedItem.titleZh,
                            },
                          },
                          null,
                          2
                        )}
                    </pre>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          /* Raycast Media Checker View */
          <div className="grid grid-cols-12 divide-x divide-[#27272a] h-[580px]">
            {/* Left 5 cols: Presets & Dropzone */}
            <div className="col-span-5 p-4 flex flex-col justify-between bg-[#121214] space-y-4">
              <div className="space-y-3">
                <div className="text-[10px] font-mono text-[#71717a] uppercase">
                  1-Click Test Presets (快速测试预设)
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <button
                    onClick={() => handlePreset('jpg')}
                    className="w-full text-left p-2.5 rounded-lg bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-slate-200 flex items-center justify-between"
                  >
                    <span>🖼️ 合规 JPG 图片 (800x600)</span>
                    <span className="text-[10px] text-emerald-400">PASS</span>
                  </button>
                  <button
                    onClick={() => handlePreset('sticker')}
                    className="w-full text-left p-2.5 rounded-lg bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-slate-200 flex items-center justify-between"
                  >
                    <span>🎨 WhatsApp 512x512 WebP 贴纸</span>
                    <span className="text-[10px] text-emerald-400">PASS</span>
                  </button>
                  <button
                    onClick={() => handlePreset('docx')}
                    className="w-full text-left p-2.5 rounded-lg bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-slate-200 flex items-center justify-between"
                  >
                    <span>📄 模板不支持的 DOCX 文档</span>
                    <span className="text-[10px] text-rose-400">WARN</span>
                  </button>
                </div>

                <div className="pt-2">
                  <div className="text-[10px] font-mono text-[#71717a] uppercase mb-1.5">
                    校验模式 (Check Mode)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setCheckMode('standard')}
                      className={`p-2 rounded border text-center ${
                        checkMode === 'standard'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'border-[#27272a] bg-[#18181b] text-slate-400'
                      }`}
                    >
                      标准发送模式
                    </button>
                    <button
                      onClick={() => setCheckMode('template_header')}
                      className={`p-2 rounded border text-center ${
                        checkMode === 'template_header'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'border-[#27272a] bg-[#18181b] text-slate-400'
                      }`}
                    >
                      模板 Header 模式
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2e2e33] hover:border-emerald-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#18181b]/50"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleInspect(f);
                  }}
                />
                <Upload className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-mono text-slate-200">
                  点击或拖拽媒体文件至此
                </div>
                <div className="text-[10px] font-mono text-[#71717a] mt-1">
                  支持 JPG, PNG, WebP, MP4, MP3, PDF
                </div>
              </div>
            </div>

            {/* Right 7 cols: Media Inspector & Player */}
            <div className="col-span-7 p-5 flex flex-col h-full bg-[#161618] overflow-y-auto dev-scrollbar space-y-4">
              {mediaResult && mediaFile ? (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                    <div>
                      <div className="text-sm font-bold text-white flex items-center space-x-2">
                        <span>{mediaResult.fileName}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            mediaResult.overallStatus === 'pass'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {mediaResult.overallStatus.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-[#71717a] mt-0.5">
                        {formatBytes(mediaResult.fileSize)} · {mediaResult.detectedMime}
                      </div>
                    </div>
                  </div>

                  {/* Player Preview */}
                  {mediaPreviewUrl && (
                    <div className="w-full bg-black/60 rounded-lg overflow-hidden border border-[#27272a] aspect-video flex items-center justify-center">
                      {mediaResult.detectedCategory === 'video' ? (
                        <video
                          src={mediaPreviewUrl}
                          controls
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : mediaResult.detectedCategory === 'audio' ? (
                        <div className="p-4 w-full">
                          <audio src={mediaPreviewUrl} controls className="w-full" />
                        </div>
                      ) : (
                        <img
                          src={mediaPreviewUrl}
                          alt="preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      )}
                    </div>
                  )}

                  {/* Rules Matrix */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-[10px] text-[#71717a] uppercase font-bold">
                      WHATSAPP COMPLIANCE MATRIX
                    </div>
                    <div className="space-y-1">
                      {mediaResult.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded bg-[#1f1f23] border border-[#27272a] flex items-center justify-between"
                        >
                          <div>
                            <div className="text-slate-200 font-semibold">{item.name}</div>
                            <div className="text-[11px] text-[#71717a]">
                              期望: {item.expected} | 实际: {item.actual}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.status === 'pass'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#71717a] space-y-2">
                  <Command className="w-8 h-8 text-[#3f3f46]" />
                  <div className="font-mono text-xs">请在左侧选择测试预设或拖入媒体文件</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raycast Persistent Action HUD / Status Bar */}
        <div className="px-4 py-2 bg-[#101012] border-t border-[#27272a] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#71717a]">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#a1a1aa]">
              {viewMode === 'errors'
                ? `Raycast > #${selectedErrorCode} ${selectedItem?.titleZh || ''}`
                : `Raycast > 媒体检测工作台 (${mediaFile ? mediaFile.name : '未载入文件'})`}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="flex items-center space-x-1">
              <kbd className="kbd-shortcut">↵</kbd>
              <span>查看</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="kbd-shortcut">Space</kbd>
              <span>排查打勾</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="kbd-shortcut">⌘K</kbd>
              <span>切模式</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="kbd-shortcut">↑↓</kbd>
              <span>快速切行</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
