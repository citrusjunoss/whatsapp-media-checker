import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileCode,
  Terminal,
} from 'lucide-react';

export const ErrorLookup: React.FC = () => {
  const dataset = useMemo(() => getLoadedErrorDataset(), []);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedPayloads, setExpandedPayloads] = useState<Record<number, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' or '⌘K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredErrors = useMemo(() => {
    return searchErrors(query, activeCategory, dataset.items);
  }, [query, activeCategory, dataset.items]);

  const togglePayload = (code: number) => {
    setExpandedPayloads((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const handleCopyReport = (item: WhatsAppErrorItem) => {
    const reportText = `[WhatsApp API 错误诊断]
Code: ${item.code} | HTTP ${item.httpStatus || 400}
Category: ${item.categoryNameZh} (${item.category})
Title: ${item.titleZh} / ${item.titleEn}
Cause:
${item.detailsZh}
Resolution:
${item.solutionZh}
Doc: ${item.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}`;

    navigator.clipboard.writeText(reportText);
    setCopiedCode(item.code);
    setTimeout(() => setCopiedCode(null), 2000);
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

  return (
    <div className="space-y-4">
      {/* Precision Command Search Bar (Raycast / Linear Style) */}
      <div className="app-surface rounded-lg border app-border p-3.5 space-y-3 transition-colors">
        <div className="flex items-center justify-between text-xs app-text-muted">
          <div className="flex items-center space-x-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono font-semibold app-text-main">Meta WhatsApp Cloud API Error Directory</span>
            <span className="text-[11px] font-mono px-1.5 rounded app-surface-subtle border app-border app-text-dim">
              {dataset.totalCount} entries
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono app-text-dim hidden sm:flex">
            <RefreshCw className="w-3 h-3" />
            <span>Synced: {formattedSyncDate}</span>
          </div>
        </div>

        {/* Input Field with keyboard shortcut prompt */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 app-text-dim absolute left-3.5 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索代码 (如 131047, 190) 或中英文关键词 (24小时, template, token, undeliverable)..."
            className="w-full pl-9 pr-14 py-2 app-surface-subtle app-text-main placeholder:app-text-dim rounded-md text-xs font-mono border app-border focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <div className="absolute right-3 flex items-center space-x-1.5">
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="p-0.5 app-text-dim hover:app-text-main rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono app-text-dim app-surface rounded border app-border">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Quick Filter Code Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
          <span className="text-[11px] font-mono app-text-dim mr-1">HOT:</span>
          {POPULAR_ERROR_CODES.map((item) => (
            <button
              key={item.code}
              onClick={() => setQuery(item.code.toString())}
              className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-all ${
                query === item.code.toString()
                  ? 'app-surface text-emerald-500 border-emerald-500/50 font-bold'
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
      </div>

      {/* Category Pills Row */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        {ERROR_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded text-xs font-medium font-mono whitespace-nowrap border transition-all ${
              activeCategory === cat.id
                ? 'app-surface app-text-main border-emerald-500/60 font-semibold'
                : 'app-surface-subtle app-text-muted hover:app-text-main app-border'
            }`}
          >
            <span>{cat.nameZh}</span>
          </button>
        ))}
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs font-mono app-text-dim px-1">
        <span>MATCHED: {filteredErrors.length} / {dataset.totalCount} CODES</span>
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setActiveCategory('all');
            }}
            className="text-emerald-500 hover:underline"
          >
            RESET_FILTER
          </button>
        )}
      </div>

      {/* Error Items List */}
      <div className="space-y-3">
        {filteredErrors.length > 0 ? (
          filteredErrors.map((item) => {
            const isPayloadOpen = !!expandedPayloads[item.code];
            const isCopied = copiedCode === item.code;

            return (
              <div
                key={item.code}
                className="app-surface rounded-lg border app-border overflow-hidden transition-colors"
              >
                {/* Header Strip */}
                <div className="px-4 py-2.5 border-b app-border app-surface-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm tracking-tight text-emerald-500">
                      #{item.code}
                    </span>

                    {getSeverityBadge(item.severity)}

                    <span className="font-mono text-[11px] app-text-dim px-1.5 py-0.5 rounded app-surface border app-border">
                      {item.category}
                    </span>

                    {item.httpStatus && (
                      <span className="font-mono text-[11px] app-text-dim">
                        HTTP {item.httpStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopyReport(item)}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono app-surface app-text-muted hover:app-text-main border app-border transition-colors"
                      title="复制诊断报告"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span className="text-emerald-500">COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>COPY_REPORT</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-500 hover:text-emerald-400 app-surface border app-border transition-colors"
                    >
                      <span>DOCS</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                {/* Content Block */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <div>
                    <h3 className="text-sm font-bold app-text-main tracking-tight">
                      {item.titleZh}
                    </h3>
                    <div className="text-xs font-mono app-text-dim mt-0.5">
                      {item.titleEn}
                    </div>
                  </div>

                  {/* Dual Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-md app-surface-subtle border app-border space-y-1">
                      <div className="text-[11px] font-mono font-semibold app-text-dim uppercase">
                        原因与释义 (Diagnosis)
                      </div>
                      <p className="app-text-muted leading-relaxed whitespace-pre-line text-xs">
                        {item.detailsZh}
                      </p>
                    </div>

                    <div className="p-3 rounded-md app-surface-subtle border app-border space-y-1">
                      <div className="text-[11px] font-mono font-semibold app-text-dim uppercase">
                        Meta Official Details
                      </div>
                      <p className="app-text-dim font-mono text-[11px] leading-relaxed whitespace-pre-line">
                        {item.detailsEn}
                      </p>
                    </div>
                  </div>

                  {/* Solution Block */}
                  <div className="p-3 rounded-md app-surface-subtle border app-border text-xs space-y-1">
                    <div className="text-[11px] font-mono font-bold text-emerald-500 uppercase flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>解决方案 (Resolution Action)</span>
                    </div>
                    <p className="app-text-main leading-relaxed whitespace-pre-line font-medium text-xs">
                      {item.solutionZh}
                    </p>
                    {item.solutionEn && item.solutionEn !== item.solutionZh && (
                      <p className="app-text-dim font-mono text-[11px] pt-1.5 border-t app-border leading-relaxed">
                        {item.solutionEn}
                      </p>
                    )}
                  </div>

                  {/* Payload Accordion */}
                  {item.examplePayload && (
                    <div className="pt-1">
                      <button
                        onClick={() => togglePayload(item.code)}
                        className="flex items-center space-x-1.5 text-[11px] font-mono app-text-dim hover:app-text-main transition-colors"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>{isPayloadOpen ? 'HIDE_PAYLOAD_JSON' : 'VIEW_PAYLOAD_JSON'}</span>
                        {isPayloadOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isPayloadOpen && (
                        <div className="mt-2">
                          <pre className="app-code-bg app-border border p-3 rounded text-[11px] font-mono app-text-muted overflow-x-auto">
                            {item.examplePayload}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="app-surface rounded-lg border app-border p-10 text-center space-y-2">
            <div className="font-mono text-sm app-text-muted">NO_MATCHING_ERROR_CODES</div>
            <p className="text-xs app-text-dim font-mono">
              没有找到与 &quot;{query}&quot; 相关的 WhatsApp 错误记录。
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('all');
                }}
                className="px-3 py-1 app-surface-subtle border app-border rounded text-xs font-mono app-text-main hover:app-surface-hover"
              >
                RESET_QUERY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
