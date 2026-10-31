import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FormattedText } from './common/FormattedText';
import {
  getLoadedErrorDataset,
  searchErrors,
  ERROR_CATEGORIES,
  POPULAR_ERROR_CODES,
  WhatsAppErrorItem,
  ErrorSeverity,
} from '../core/errorEngine';
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
  RefreshCw,
  CheckSquare,
  Square,
  FileCode,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Info,
  ChevronRight,
} from 'lucide-react';

interface RetryAdvice {
  retryable: boolean;
  label: string;
  badgeClass: string;
  advice: string;
}

function getRetryAdvice(item: WhatsAppErrorItem): RetryAdvice {
  if (item.severity === 'rate_limit') {
    return {
      retryable: true,
      label: '指数退避重试 (Exponential Backoff)',
      badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      advice: '该错误通常为高并发超频导致。建议暂停向此号码或账号推送，使用指数退避算法（如 5s、15s、30s）延迟重试，并于网关层引入令牌桶或漏桶限流。',
    };
  }

  if (item.severity === 'service_unavailable') {
    return {
      retryable: true,
      label: '短暂故障可重试 (Transient Outage)',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      advice: 'Meta 内部服务暂时不可用或上游网络超时。属于服务端临时故障，建议记录告警并在 30s-60s 后重试，同时关注 Meta Status 官方状态页。',
    };
  }

  if (item.code === 131047) {
    return {
      retryable: false,
      label: '不可直接重试 · 需等待用户回复或使用付费模板',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      advice: '24 小时客服会话窗口已关闭。无法再次发送普通自由文本/媒体消息，必须等待用户主动回复发起新窗口，或切换为已审核通过的付费模板消息 (Utility/Marketing Template)。',
    };
  }

  if (item.code === 190) {
    return {
      retryable: false,
      label: '不可重试 · Token 鉴权凭证失效',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      advice: '当前 Access Token 已过期、用户重置了密码或应用权限已被吊销。请前往 Meta 业务管理平台重新生成具有 whatsapp_business_messaging 权限的永久系统用户令牌。',
    };
  }

  if (item.code === 131052 || item.code === 131051) {
    return {
      retryable: false,
      label: '不可直接重试 · 文件规格超标',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      advice: '多媒体格式或体积超出 WhatsApp API 限制。请使用上方【媒体检测与转码】工具自动化转换为合规规格（如压缩至限制以内、转码为 H.264+AAC MP4 或 512x512 WebP）。',
    };
  }

  if (item.code === 132000 || item.code === 132001 || item.code === 192) {
    return {
      retryable: false,
      label: '不可重试 · 模板参数不匹配',
      badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      advice: '模板占位符参数数量、格式或类型与 Meta 审核通过的版本不一致。需比对接口 payload 与模板定义，调整变量后重发。',
    };
  }

  return {
    retryable: false,
    label: '需修正请求参数 (Client Error)',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    advice: '请求参数或业务状态不满足 Meta API 校验规则。重试相同 payload 仍将失败，请按照下方排查清单核对入参后重试。',
  };
}

function parseSolutionSteps(solutionZh: string): string[] {
  if (!solutionZh) return ['查阅 Meta 官方文档排查该错误代码。'];

  // Split by numbered steps or semicolons or line breaks
  const rawLines = solutionZh
    .split(/(?:\r?\n|;|；|(?<=\d[、.．])|\d+[.、．]\s*)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (rawLines.length === 0) {
    return [solutionZh];
  }

  return rawLines;
}

function generateSimulatedPayload(item: WhatsAppErrorItem): string {
  if (item.examplePayload) {
    try {
      // Re-format if valid JSON
      const parsed = JSON.parse(item.examplePayload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return item.examplePayload;
    }
  }

  return JSON.stringify(
    {
      error: {
        message: `(#${item.code}) ${item.titleEn}`,
        type: item.severity === 'rate_limit' ? 'OAuthException' : 'GraphMethodException',
        code: item.code,
        error_subcode: item.subcode || undefined,
        error_user_title: item.titleZh,
        error_user_msg: item.detailsZh,
        fbtrace_id: 'A' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      },
    },
    null,
    2
  );
}

function generateSimulatedCurl(item: WhatsAppErrorItem): string {
  if (item.category === 'template' || item.code === 192) {
    return `curl -X POST "https://graph.facebook.com/v26.0/{PHONE_NUMBER_ID}/messages" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messaging_product": "whatsapp",
    "to": "+15551234567",
    "type": "template",
    "template": {
      "name": "sample_template",
      "language": { "code": "en_US" },
      "components": []
    }
  }'`;
  }

  if (item.category === 'media' || item.code === 131052 || item.code === 131053) {
    return `curl -X POST "https://graph.facebook.com/v26.0/{PHONE_NUMBER_ID}/media" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -F "file=@/path/to/media.mp4;type=video/mp4" \\
  -F "messaging_product=whatsapp"`;
  }

  return `curl -X POST "https://graph.facebook.com/v26.0/{PHONE_NUMBER_ID}/messages" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+15551234567",
    "type": "text",
    "text": { "preview_url": false, "body": "Hello WhatsApp API" }
  }'`;
}

export const ErrorLookup: React.FC = () => {
  const dataset = useMemo(() => getLoadedErrorDataset(), []);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | ErrorSeverity>('all');
  const [selectedCode, setSelectedCode] = useState<string | number | null>(131047);
  const [copiedType, setCopiedType] = useState<'report' | 'payload' | 'curl' | null>(null);
  const [detailTab, setDetailTab] = useState<'checklist' | 'payload' | 'curl'>('checklist');
  const [checkedSteps, setCheckedSteps] = useState<Record<string | number, Record<number, boolean>>>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' or '⌘K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered dataset
  const filteredErrors = useMemo(() => {
    let list = searchErrors(query, activeCategory, dataset.items);
    if (severityFilter !== 'all') {
      list = list.filter((item) => item.severity === severityFilter);
    }
    return list;
  }, [query, activeCategory, severityFilter, dataset.items]);

  // Keep selectedCode valid
  useEffect(() => {
    if (filteredErrors.length > 0) {
      const exists = filteredErrors.some((item) => item.code === selectedCode);
      if (!exists) {
        setSelectedCode(filteredErrors[0].code);
      }
    } else {
      setSelectedCode(null);
    }
  }, [filteredErrors, selectedCode]);

  // Arrow key navigation between error codes
  useEffect(() => {
    const handleNavigation = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        if (e.key === 'Escape') {
          inputRef.current?.blur();
        }
        return;
      }

      if (filteredErrors.length === 0) return;

      const currentIndex = filteredErrors.findIndex((item) => item.code === selectedCode);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < filteredErrors.length - 1 ? currentIndex + 1 : 0;
        setSelectedCode(filteredErrors[nextIndex].code);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredErrors.length - 1;
        setSelectedCode(filteredErrors[prevIndex].code);
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [filteredErrors, selectedCode]);

  // Scroll active item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedCode]);

  const selectedItem = useMemo(() => {
    return dataset.items.find((item) => item.code === selectedCode) || null;
  }, [dataset.items, selectedCode]);

  const retryAdvice = useMemo(() => {
    return selectedItem ? getRetryAdvice(selectedItem) : null;
  }, [selectedItem]);

  const solutionSteps = useMemo(() => {
    return selectedItem ? parseSolutionSteps(selectedItem.solutionZh) : [];
  }, [selectedItem]);

  const simulatedPayload = useMemo(() => {
    return selectedItem ? generateSimulatedPayload(selectedItem) : '';
  }, [selectedItem]);

  const simulatedCurl = useMemo(() => {
    return selectedItem ? generateSimulatedCurl(selectedItem) : '';
  }, [selectedItem]);

  const toggleStep = (code: string | number, stepIndex: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [code]: {
        ...(prev[code] || {}),
        [stepIndex]: !prev[code]?.[stepIndex],
      },
    }));
  };

  const handleCopyReport = (item: WhatsAppErrorItem) => {
    const advice = getRetryAdvice(item);
    const reportText = `[WhatsApp Cloud API 错误诊断报告]
错误代码: #${item.code} | HTTP ${item.httpStatus || 400}
分类: ${item.categoryNameZh} (${item.category})
级别: ${item.severity.toUpperCase()}
重试策略: ${advice.label}

【故障中文名称】: ${item.titleZh}
【官方英文名称】: ${item.titleEn}

【业务影响与深度原因剖析】:
${item.detailsZh}

【Meta 官方释义】:
${item.detailsEn}

【排查与修复方案】:
${item.solutionZh}

【运维策略建议】:
${advice.advice}

【官方文档链接】:
${item.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}`;

    navigator.clipboard.writeText(reportText);
    setCopiedType('report');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyText = (text: string, type: 'payload' | 'curl') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'blocker':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            <span>BLOCKER</span>
          </span>
        );
      case 'rate_limit':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            <span>THROTTLED</span>
          </span>
        );
      case 'service_unavailable':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ServerCrash className="w-3 h-3" />
            <span>OUTAGE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>CLIENT_ERR</span>
          </span>
        );
    }
  };

  const formattedSyncDate = useMemo(() => {
    try {
      const d = new Date(dataset.lastSyncedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '近期';
    }
  }, [dataset.lastSyncedAt]);

  const completedStepsCount = useMemo(() => {
    if (!selectedCode) return 0;
    const currentCodeSteps = checkedSteps[selectedCode] || {};
    return Object.values(currentCodeSteps).filter(Boolean).length;
  }, [checkedSteps, selectedCode]);

  return (
    <div className="space-y-4">
      {/* Top Banner / Command Header */}
      <div className="app-surface rounded-lg border app-border p-3.5 space-y-3 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs app-text-muted">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono font-semibold app-text-main">
              WhatsApp Cloud API 错误全量诊断工作台
            </span>
            <span className="text-[11px] font-mono px-1.5 rounded app-surface-subtle border app-border app-text-dim">
              v26.0 · {dataset.totalCount} 官方条目
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono app-text-dim">
            <div className="hidden sm:flex items-center space-x-1">
              <kbd className="kbd-shortcut">↑</kbd>
              <kbd className="kbd-shortcut">↓</kbd>
              <span>上下键快速切行</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span>同步基准: {formattedSyncDate}</span>
            </div>
          </div>
        </div>

        {/* Search Bar + Quick Clear */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 app-text-dim absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入错误代码 (如 131047, 192, 190) 或故障关键词 (24小时, template, token, undeliverable, 频控)..."
            className="w-full pl-9 pr-20 py-2.5 app-surface-subtle app-text-main placeholder:app-text-dim rounded-md text-xs font-mono border app-border focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <div className="absolute right-3 flex items-center space-x-1.5">
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 app-text-dim hover:app-text-main rounded transition-colors"
                title="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1">
                <kbd className="kbd-shortcut">⌘K</kbd>
                <kbd className="kbd-shortcut">/</kbd>
              </div>
            )}
          </div>
        </div>

        {/* Hot Query Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
          <span className="text-[11px] font-mono app-text-dim mr-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>高频突发:</span>
          </span>
          {POPULAR_ERROR_CODES.map((item) => (
            <button
              key={item.code}
              onClick={() => {
                setQuery(item.code.toString());
                setSelectedCode(item.code);
              }}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-all ${
                selectedCode === item.code
                  ? 'app-surface text-emerald-500 border-emerald-500 font-bold'
                  : 'app-surface-subtle app-text-muted hover:app-text-main app-border'
              }`}
            >
              <span>{item.code}</span>
              <span className="app-text-dim ml-1 text-[10px]">
                {item.label.split('·')[1]?.trim()}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Controls: Severity Pills + Category Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t app-border">
          {/* Severity Pills */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-[11px] font-mono app-text-dim mr-1">级别:</span>
            {[
              { id: 'all', label: '全部' },
              { id: 'blocker', label: '阻断 (BLOCKER)' },
              { id: 'rate_limit', label: '限流 (THROTTLED)' },
              { id: 'service_unavailable', label: '故障 (OUTAGE)' },
              { id: 'client_error', label: '客户端 (CLIENT)' },
            ].map((sev) => (
              <button
                key={sev.id}
                onClick={() => setSeverityFilter(sev.id as any)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                  severityFilter === sev.id
                    ? 'app-surface text-emerald-500 border-emerald-500 font-semibold'
                    : 'app-surface-subtle app-text-dim hover:app-text-main app-border'
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>

          {/* Category Selector */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-mono app-text-dim">分类:</span>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="app-surface-subtle app-text-main text-[11px] font-mono rounded border app-border px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {ERROR_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameZh}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Dual-Pane Developer Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-2 contain-layout min-w-0">
          <div className="flex items-center justify-between text-xs font-mono app-text-dim px-1">
            <span>
              匹配结果: {filteredErrors.length} / {dataset.totalCount} 错误项
            </span>
            {(query || activeCategory !== 'all' || severityFilter !== 'all') && (
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('all');
                  setSeverityFilter('all');
                }}
                className="text-emerald-500 hover:underline flex items-center space-x-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>重置筛选</span>
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="space-y-1.5 max-h-[calc(100vh-250px)] min-h-[480px] overflow-y-auto pr-1 dev-scrollbar">
            {filteredErrors.length > 0 ? (
              filteredErrors.map((item) => {
                const isSelected = selectedCode === item.code;
                return (
                  <div
                    key={item.code}
                    ref={isSelected ? activeItemRef : null}
                    onClick={() => setSelectedCode(item.code)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'app-surface border-emerald-500 shadow-sm ring-1 ring-emerald-500/30'
                        : 'app-surface-subtle app-border hover:border-slate-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-emerald-500">
                          #{item.code}
                        </span>
                        {getSeverityBadge(item.severity)}
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded app-surface app-border border app-text-dim">
                        {item.categoryNameZh || item.category}
                      </span>
                    </div>

                    <div className="font-medium app-text-main line-clamp-1 text-xs">
                      {item.titleZh}
                    </div>
                    <div className="font-mono text-[10px] app-text-dim line-clamp-1 mt-0.5">
                      {item.titleEn}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="app-surface rounded-lg border app-border p-8 text-center space-y-2">
                <div className="font-mono text-xs app-text-muted">未找到匹配的错误代码</div>
                <p className="text-[11px] app-text-dim font-mono">
                  没有记录与 &quot;{query}&quot; 符合的 WhatsApp 错误。
                </p>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveCategory('all');
                    setSeverityFilter('all');
                  }}
                  className="px-3 py-1 app-surface-subtle border app-border rounded text-xs font-mono app-text-main hover:bg-slate-700/20"
                >
                  重置筛选条件
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Diagnostic Console (7 cols) */}
        <div className="lg:col-span-7 sticky top-20 contain-layout min-w-0">
          {selectedItem && retryAdvice ? (
            <div className="app-surface rounded-lg border app-border overflow-hidden transition-colors">
              {/* Header Hero Strip */}
              <div className="px-5 py-3.5 border-b app-border app-surface-subtle flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-xl text-emerald-500 tracking-tight">
                      #{selectedItem.code}
                    </span>
                    {getSeverityBadge(selectedItem.severity)}
                    {selectedItem.httpStatus && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded app-surface border app-border app-text-dim">
                        HTTP {selectedItem.httpStatus}
                      </span>
                    )}
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded app-surface border app-border app-text-dim">
                      {selectedItem.categoryNameZh}
                    </span>
                  </div>
                  <h2 className="text-sm font-bold app-text-main">
                    {selectedItem.titleZh}
                  </h2>
                  <div className="text-xs font-mono app-text-dim">
                    {selectedItem.titleEn}
                  </div>
                </div>

                {/* Header Action Toolbar */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopyReport(selectedItem)}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono app-surface app-text-main border app-border hover:border-emerald-500/50 transition-colors"
                    title="复制全量排查报告"
                  >
                    {copiedType === 'report' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-bold">已复制报告</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 app-text-dim" />
                        <span>复制报告</span>
                      </>
                    )}
                  </button>

                  <a
                    href={
                      selectedItem.docUrl ||
                      'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono text-emerald-500 hover:text-emerald-400 app-surface border app-border transition-colors"
                  >
                    <span>官方文档</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Retry & SLA Advice Banner */}
              <div className="px-5 py-3 border-b app-border bg-slate-500/5 flex items-start space-x-3 text-xs">
                <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold app-text-main">
                      运维与重试策略 (SLA Advice):
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${retryAdvice.badgeClass}`}
                    >
                      {retryAdvice.label}
                    </span>
                  </div>
                  <p className="app-text-muted leading-relaxed text-[11px]">
                    {retryAdvice.advice}
                  </p>
                </div>
              </div>

              {/* Tab Navigation for Detail Workbench */}
              <div className="flex border-b app-border px-5 pt-2 text-xs font-mono gap-4 app-surface-subtle">
                <button
                  onClick={() => setDetailTab('checklist')}
                  className={`pb-2.5 border-b-2 font-medium flex items-center space-x-1.5 transition-colors ${
                    detailTab === 'checklist'
                      ? 'border-emerald-500 text-emerald-500 font-bold'
                      : 'border-transparent app-text-dim hover:app-text-main'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>排查清单与方案 ({completedStepsCount}/{solutionSteps.length})</span>
                </button>

                <button
                  onClick={() => setDetailTab('payload')}
                  className={`pb-2.5 border-b-2 font-medium flex items-center space-x-1.5 transition-colors ${
                    detailTab === 'payload'
                      ? 'border-emerald-500 text-emerald-500 font-bold'
                      : 'border-transparent app-text-dim hover:app-text-main'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>真实 Payload JSON</span>
                </button>

                <button
                  onClick={() => setDetailTab('curl')}
                  className={`pb-2.5 border-b-2 font-medium flex items-center space-x-1.5 transition-colors ${
                    detailTab === 'curl'
                      ? 'border-emerald-500 text-emerald-500 font-bold'
                      : 'border-transparent app-text-dim hover:app-text-main'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>cURL 复现调用</span>
                </button>
              </div>

              {/* Detail Tab Contents */}
              <div className="p-5 space-y-4">
                {detailTab === 'checklist' && (
                  <div className="space-y-4">
                    {/* Interactive Checklist */}
                    <div className="p-4 rounded-lg app-surface-subtle border app-border space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono font-semibold text-emerald-500 uppercase flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>生产故障排查行动项 (Actionable Checklist)</span>
                        </div>
                        <div className="text-[11px] font-mono app-text-dim">
                          进度: {completedStepsCount} / {solutionSteps.length} 已排查
                        </div>
                      </div>

                      <div className="space-y-2">
                        {solutionSteps.map((step, idx) => {
                          const isDone = !!checkedSteps[selectedItem.code]?.[idx];
                          return (
                            <div
                              key={idx}
                              onClick={() => toggleStep(selectedItem.code, idx)}
                              className={`flex items-start space-x-2.5 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                                isDone
                                  ? 'bg-emerald-500/5 border-emerald-500/30 line-through app-text-dim'
                                  : 'app-surface app-border hover:border-slate-500/50 app-text-main'
                              }`}
                            >
                              <button className="shrink-0 mt-0.5 text-emerald-500">
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                                ) : (
                                  <Square className="w-4 h-4 app-text-dim" />
                                )}
                              </button>
                              <span className="leading-relaxed font-sans">
                                <FormattedText text={step} linkColor="text-emerald-500 hover:text-emerald-400 underline font-medium" />
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Official Drill-down Links */}
                      {selectedItem.relatedLinks && selectedItem.relatedLinks.length > 0 && (
                        <div className="pt-3 border-t app-border space-y-2">
                          <div className="text-[11px] font-mono font-semibold text-blue-400 uppercase flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>官方二级下钻指引与工具 (Official Drill-down)</span>
                            </span>
                            <span className="text-[10px] app-text-dim font-normal">点击直达官方页面</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedItem.relatedLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="flex items-center justify-between p-2 rounded-md app-surface border app-border hover:border-emerald-500/50 text-xs app-text-main transition-colors group font-mono"
                              >
                                <span className="truncate group-hover:text-emerald-500 font-medium">
                                  {link.title}
                                </span>
                                <ExternalLink className="w-3 h-3 app-text-dim group-hover:text-emerald-500 shrink-0 ml-2" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedItem.solutionEn && selectedItem.solutionEn !== selectedItem.solutionZh && (
                        <div className="pt-2 border-t app-border text-[11px] font-mono app-text-dim leading-relaxed">
                          <div className="font-semibold mb-0.5 text-[10px] uppercase">Official Resolution Advice:</div>
                          <FormattedText text={selectedItem.solutionEn} linkColor="text-emerald-500 hover:text-emerald-400 underline" />
                        </div>
                      )}
                    </div>

                    {/* Dual Details Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-lg app-surface-subtle border app-border space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold app-text-dim uppercase flex items-center space-x-1">
                          <Info className="w-3 h-3 text-blue-400" />
                          <span>业务原因与故障机制 (Diagnosis)</span>
                        </div>
                        <p className="app-text-muted leading-relaxed whitespace-pre-line text-xs font-sans">
                          <FormattedText text={selectedItem.detailsZh} linkColor="text-blue-400 hover:underline" />
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg app-surface-subtle border app-border space-y-1.5">
                        <div className="text-[11px] font-mono font-semibold app-text-dim uppercase">
                          Meta Official Details (EN)
                        </div>
                        <p className="app-text-dim font-mono text-[11px] leading-relaxed whitespace-pre-line">
                          {selectedItem.detailsEn}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === 'payload' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono app-text-dim">
                      <span>Meta Graph API / Webhook 返回结构</span>
                      <button
                        onClick={() => handleCopyText(simulatedPayload, 'payload')}
                        className="flex items-center space-x-1 text-emerald-500 hover:text-emerald-400"
                      >
                        {copiedType === 'payload' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>已复制 JSON</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制 Payload</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="app-code-bg app-border border p-4 rounded-lg text-xs font-mono app-text-muted overflow-x-auto leading-relaxed">
                      {simulatedPayload}
                    </pre>
                  </div>
                )}

                {detailTab === 'curl' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono app-text-dim">
                      <span>cURL 复现与测试请求命令</span>
                      <button
                        onClick={() => handleCopyText(simulatedCurl, 'curl')}
                        className="flex items-center space-x-1 text-emerald-500 hover:text-emerald-400"
                      >
                        {copiedType === 'curl' ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>已复制 cURL</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制 cURL</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="app-code-bg app-border border p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                      {simulatedCurl}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="app-surface rounded-lg border app-border p-12 text-center space-y-2">
              <ChevronRight className="w-8 h-8 app-text-dim mx-auto" />
              <div className="font-mono text-sm app-text-muted">请从左侧选择错误代码</div>
              <p className="text-xs app-text-dim font-mono">
                支持通过键盘上下方向键或点击左侧错误列表进行实时诊断
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
