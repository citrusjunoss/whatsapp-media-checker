import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  getLoadedErrorDataset,
  searchErrors,
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
  FileCheck,
  Upload,
  CheckSquare,
  Square,
  Sparkles,
  Command,
  FileCode,
  ShieldAlert,
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ConverterPanel } from '../ConverterPanel';
import { useTheme } from '../../core/themeContext';

interface RaycastViewProps {
  activeNav: 'file_tools' | 'error_lookup';
  onNavChange: (nav: 'file_tools' | 'error_lookup') => void;
  onOpenRules: () => void;
}

export const RaycastView: React.FC<RaycastViewProps> = ({
  activeNav,
  onNavChange,
  onOpenRules,
}) => {
  const { setTheme } = useTheme();
  const dataset = useMemo(() => getLoadedErrorDataset(), []);

  // Search & Navigation
  const [query, setQuery] = useState('');
  const [selectedErrorCode, setSelectedErrorCode] = useState<number>(131047);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, Record<number, boolean>>>({});

  // Media Inspection State
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaResult, setMediaResult] = useState<ValidationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkMode, setCheckMode] = useState<CheckMode>('standard');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: '/' or '⌘K' to focus launcher search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onNavChange(activeNav === 'error_lookup' ? 'file_tools' : 'error_lookup');
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
  }, [activeNav, onNavChange]);

  // Filtered error list
  const filteredErrors = useMemo(() => {
    return searchErrors(query, 'all', dataset.items);
  }, [query, dataset.items]);

  // Keep selected error valid
  useEffect(() => {
    if (activeNav === 'error_lookup' && filteredErrors.length > 0) {
      if (!filteredErrors.some((i) => i.code === selectedErrorCode)) {
        setSelectedErrorCode(filteredErrors[0].code);
      }
    }
  }, [filteredErrors, selectedErrorCode, activeNav]);

  // Container-only smooth scroll when selection changes (NEVER scrolls whole window)
  useEffect(() => {
    const listEl = listContainerRef.current;
    const itemEl = itemRefs.current[selectedErrorCode];
    if (listEl && itemEl) {
      const itemTop = itemEl.offsetTop;
      const itemBottom = itemTop + itemEl.offsetHeight;
      if (itemTop < listEl.scrollTop) {
        listEl.scrollTop = itemTop;
      } else if (itemBottom > listEl.scrollTop + listEl.clientHeight) {
        listEl.scrollTop = itemBottom - listEl.clientHeight;
      }
    }
  }, [selectedErrorCode]);

  // Keyboard arrow keys in error mode
  useEffect(() => {
    const handleArrowNav = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
      } else if (document.activeElement === inputRef.current) {
        return;
      }

      if (activeNav === 'error_lookup' && filteredErrors.length > 0) {
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
          // Toggle first step
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
  }, [activeNav, filteredErrors, selectedErrorCode]);

  // Media Inspection
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
    <div className="w-full space-y-4 font-sans">
      {/* Raycast Floating Command Palette Window */}
      <div className="bg-[#141415] text-[#ededed] border border-[#27272a] rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Raycast Header Bar & Command Input */}
        <div className="p-3.5 border-b border-[#27272a] flex flex-wrap items-center justify-between gap-3 bg-[#18181b]/90">
          <div className="flex items-center space-x-2.5 flex-1 min-w-[280px]">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Command className="w-4 h-4" />
            </div>
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-[#71717a] absolute left-2.5 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  activeNav === 'error_lookup'
                    ? '搜索 77 个错误代码 (如 131047, 192) 或中英文症状 (24小时, template, token)...'
                    : 'Raycast 媒体检测：支持拖拽、快速预设或格式嗅探...'
                }
                className="w-full bg-[#18181b] rounded-md pl-8 pr-12 py-2 text-xs font-mono text-[#ededed] placeholder:text-[#71717a] border border-[#27272a] focus:outline-none focus:border-emerald-500"
              />
              <div className="absolute right-2.5 flex items-center space-x-1">
                {query ? (
                  <button
                    onClick={() => setQuery('')}
                    className="p-0.5 text-[#71717a] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#71717a] bg-[#222225] rounded border border-[#303036]">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs + Internal Theme Switcher */}
          <div className="flex items-center space-x-2 text-xs font-mono">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onNavChange('error_lookup')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  activeNav === 'error_lookup'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-[#a1a1aa] hover:bg-[#222226] hover:text-[#ededed]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>错误代码 ({dataset.totalCount})</span>
              </button>

              <button
                onClick={() => onNavChange('file_tools')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  activeNav === 'file_tools'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-[#a1a1aa] hover:bg-[#222226] hover:text-[#ededed]'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>媒体工具 (Media)</span>
              </button>
            </div>

            {/* Raycast Internal Theme Switcher */}
            <div className="flex items-center space-x-1 pl-2 border-l border-[#27272a]">
              <button
                onClick={() => setTheme('stripe')}
                className="px-2 py-1 rounded bg-[#222226] hover:bg-[#2c2c31] text-[#a1a1aa] hover:text-[#ededed] border border-[#2e2e33] transition-colors flex items-center space-x-1 text-[11px]"
                title="切换到 Stripe 浅白主题"
              >
                <span>💳 Stripe</span>
              </button>
              <button
                onClick={() => setTheme('github')}
                className="px-2 py-1 rounded bg-[#222226] hover:bg-[#2c2c31] text-[#a1a1aa] hover:text-[#ededed] border border-[#2e2e33] transition-colors flex items-center space-x-1 text-[11px]"
                title="切换到 GitHub 终端主题"
              >
                <span>🐙 GitHub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hot Query Chips in Error Mode */}
        {activeNav === 'error_lookup' && (
          <div className="px-4 py-2 border-b border-[#27272a] bg-[#101012] flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono text-[#71717a] mr-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>高频突发:</span>
            </span>
            {POPULAR_ERROR_CODES.map((item) => (
              <button
                key={item.code}
                onClick={() => {
                  setQuery(item.code.toString());
                  setSelectedErrorCode(item.code);
                }}
                className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                  selectedErrorCode === item.code
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                    : 'bg-[#18181b] border-[#27272a] text-[#a1a1aa] hover:text-white'
                }`}
              >
                <span>{item.code}</span>
                <span className="text-[#71717a] ml-1 text-[10px]">
                  {item.label.split('·')[1]?.trim()}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Raycast Dual-Pane Body */}
        {activeNav === 'error_lookup' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#27272a] min-h-[540px]">
            {/* Left Column: Command List (5 cols) */}
            <div className="lg:col-span-5 flex flex-col bg-[#121214] max-h-[620px]">
              <div className="px-3.5 py-2 text-[10px] font-mono text-[#71717a] border-b border-[#27272a] flex justify-between items-center bg-[#151518]">
                <span>ERROR COMMANDS</span>
                <span className="text-emerald-400 font-bold">{filteredErrors.length} MATCHED</span>
              </div>

              <div
                ref={listContainerRef}
                className="flex-1 overflow-y-auto dev-scrollbar p-2 space-y-1"
              >
                {filteredErrors.map((item) => {
                  const isSelected = selectedErrorCode === item.code;
                  return (
                    <div
                      key={item.code}
                      ref={(el) => {
                        itemRefs.current[item.code] = el;
                      }}
                      onClick={() => setSelectedErrorCode(item.code)}
                      className={`px-3 py-2.5 rounded-lg text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 text-white border border-emerald-500/40 font-semibold shadow-xs'
                          : 'text-[#a1a1aa] hover:bg-[#1a1a1e] hover:text-[#ededed]'
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
            <div className="lg:col-span-7 flex flex-col bg-[#161618] overflow-y-auto dev-scrollbar p-5 space-y-4 max-h-[620px]">
              {selectedItem ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[#27272a]">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-mono font-black text-emerald-400">
                          #{selectedItem.code}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272a] text-slate-300">
                          HTTP {selectedItem.httpStatus || 400}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272a] text-emerald-400">
                          {selectedItem.categoryNameZh}
                        </span>
                      </div>
                      <h2 className="text-sm font-bold text-white">
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
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* SLA Advice */}
                  <div className="p-3 rounded-lg bg-[#1a1a1e] border border-[#27272a] text-xs flex items-start space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-mono text-[11px] text-emerald-400 font-bold uppercase mb-0.5">
                        运维策略建议 (SLA Policy)
                      </div>
                      <p className="text-[#d4d4d8] leading-relaxed text-[11px]">
                        {selectedItem.severity === 'rate_limit'
                          ? '触发并发限流，建议启用指数退避重试（5s、15s 后重发）。'
                          : selectedItem.code === 131047
                          ? '24小时窗口关闭，不可直接重试，需等待用户回复或改用付费模板消息。'
                          : '客户端参数不合规，请核对下方排查清单修正请求。'}
                      </p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="p-3.5 rounded-lg bg-[#1a1a1e] border border-[#27272a] space-y-1 text-xs">
                    <div className="font-mono text-[10px] text-emerald-400 font-bold uppercase">
                      业务原因剖析 (Root Cause)
                    </div>
                    <p className="text-[#d4d4d8] leading-relaxed">
                      {selectedItem.detailsZh}
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="p-3.5 rounded-lg bg-[#1a1a1e] border border-[#27272a] space-y-2.5 text-xs">
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
                                : 'bg-[#18181b] text-[#ededed] hover:bg-[#222226]'
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
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#27272a]">
            {/* Left Column: Presets & Dropzone (5 cols) */}
            <div className="lg:col-span-5 p-4 flex flex-col justify-start bg-[#121214] space-y-3.5">
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

              {/* Media Input DropZone (Supports Local Drop & Remote URL Fetching) */}
              <div className="pt-2 border-t border-[#27272a]">
                <DropZone
                  mode={checkMode}
                  onFilesSelected={(files) => {
                    if (files[0]) handleInspect(files[0]);
                  }}
                  isProcessing={isChecking}
                />
              </div>
            </div>

            {/* Right Column: Media Inspector & Player (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col bg-[#161618] overflow-y-auto dev-scrollbar space-y-4 max-h-[620px]">
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

                  {/* Media Repair Toolkit / Document Notice */}
                  <div className="pt-3 border-t border-[#27272a] space-y-2">
                    <div className="text-[10px] font-mono text-[#71717a] uppercase font-bold flex items-center justify-between">
                      <span>
                        {mediaResult.detectedCategory === 'video'
                          ? '视频转码修复工作台 (FFmpeg WebAssembly)'
                          : mediaResult.detectedCategory === 'audio'
                          ? '音频转码修复工作台 (WebAudio / LameJS)'
                          : mediaResult.detectedCategory === 'image' || mediaResult.detectedCategory === 'sticker'
                          ? '图片裁剪与贴纸工作台 (Canvas 2D / WebP)'
                          : '文档说明与操作指南'}
                      </span>
                      <span className="text-emerald-400">
                        {mediaResult.detectedCategory === 'document' ? '合规直传' : '纯前端离线加速'}
                      </span>
                    </div>
                    <ConverterPanel activeResult={mediaResult} file={mediaFile} />
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-[#71717a] space-y-2">
                  <Command className="w-8 h-8 text-[#3f3f46]" />
                  <div className="font-mono text-xs">请在左侧选择测试预设或拖入媒体文件</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raycast Persistent Action HUD / Status Bar */}
        <div className="px-4 py-2.5 bg-[#101012] border-t border-[#27272a] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#71717a] gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[#a1a1aa]">
              {activeNav === 'error_lookup'
                ? `Raycast > #${selectedErrorCode} ${selectedItem?.titleZh || ''}`
                : `Raycast > 媒体检测工作台 (${mediaFile ? mediaFile.name : '等待文件载入'})`}
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenRules}
              className="text-[#a1a1aa] hover:text-white flex items-center space-x-1 mr-1 transition-colors cursor-pointer"
              title="查看 WhatsApp 官方规范字典"
            >
              <span>📖 规范速查</span>
            </button>
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
