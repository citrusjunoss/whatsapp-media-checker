import React, { useState, useMemo } from 'react';
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
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  Clock,
  ServerCrash,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  BookOpen,
  HelpCircle,
  FileCode2,
} from 'lucide-react';

export const ErrorLookup: React.FC = () => {
  const dataset = useMemo(() => getLoadedErrorDataset(), []);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedPayloads, setExpandedPayloads] = useState<Record<number, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<number | null>(null);

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
    const reportText = `[WhatsApp API 错误诊断报告]
错误码 (Code): ${item.code}
类别: ${item.categoryNameZh} (${item.category})
标题: ${item.titleZh} / ${item.titleEn}
原因与释义:
${item.detailsZh}
官方英文说明:
${item.detailsEn}
解决方案:
${item.solutionZh}
官方文档: ${item.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}`;

    navigator.clipboard.writeText(reportText);
    setCopiedCode(item.code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'blocker':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>阻断性错误</span>
          </span>
        );
      case 'rate_limit':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>频率限制</span>
          </span>
        );
      case 'service_unavailable':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ServerCrash className="w-3 h-3 text-purple-600" />
            <span>服务维护/异常</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertTriangle className="w-3 h-3 text-blue-600" />
            <span>客户端/参数错误</span>
          </span>
        );
    }
  };

  // Format sync timestamp nicely
  const formattedSyncDate = useMemo(() => {
    try {
      const d = new Date(dataset.lastSyncedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return '近期';
    }
  }, [dataset.lastSyncedAt]);

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              WhatsApp Cloud API 官方错误库
            </span>
            <span className="text-xs text-slate-400">
              共收录 {dataset.totalCount} 个错误码 · GitHub Action 自动同步
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            WhatsApp API 错误代码秒级速查
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            支持按数字代码（如 <code className="text-emerald-300 font-mono">131047</code>、<code className="text-emerald-300 font-mono">190</code>）、英文错误原句或中文关键词（如 <span className="text-emerald-300">24小时窗口</span>、<span className="text-emerald-300">限流</span>、<span className="text-emerald-300">模板变量</span>）即时模糊匹配，并提供官方标准解决方案。
          </p>

          {/* Search Input Box */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索错误码、报错信息、英文或中文关键词 (例如: 131026, 24小时, template, token, undeliverable)..."
                className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-2xl text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Error Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-slate-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>常见高频错误：</span>
            </span>
            {POPULAR_ERROR_CODES.map((item) => (
              <button
                key={item.code}
                onClick={() => setQuery(item.code.toString())}
                className="px-2.5 py-1 text-xs rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white transition-all border border-white/10 flex items-center space-x-1.5"
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills & Metadata Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ERROR_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <span>{cat.nameZh}</span>
            </button>
          ))}
        </div>

        {/* Sync Status Badge */}
        <div className="text-xs text-slate-500 flex items-center space-x-2 flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Meta 官方数据同步：{formattedSyncDate}</span>
          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 font-mono text-[11px]">
            {filteredErrors.length} / {dataset.totalCount} 条结果
          </span>
        </div>
      </div>

      {/* Error Cards List */}
      <div className="space-y-4">
        {filteredErrors.length > 0 ? (
          filteredErrors.map((item) => {
            const isPayloadOpen = !!expandedPayloads[item.code];
            const isCopied = copiedCode === item.code;

            return (
              <div
                key={item.code}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 rounded-xl bg-slate-900 text-white font-mono font-black text-sm tracking-wide shadow-2xs">
                      #{item.code}
                    </span>

                    {getSeverityBadge(item.severity)}

                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {item.categoryNameZh}
                    </span>

                    {item.httpStatus && (
                      <span className="text-[11px] font-mono text-slate-400">
                        HTTP {item.httpStatus}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyReport(item)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                      title="复制完整诊断报告与解决步骤"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">已复制诊断报告</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>复制诊断</span>
                        </>
                      )}
                    </button>

                    <a
                      href={item.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200/80 shadow-2xs"
                      title="在 Meta 官方文档中查看"
                    >
                      <span>Meta 原文</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Titles */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {item.titleZh}
                    </h3>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">
                      {item.titleEn}
                    </div>
                  </div>

                  {/* Dual Details (Chinese + English) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center space-x-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>原因分析与中文释义</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {item.detailsZh}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Meta 官方英文描述</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-mono text-[11px] whitespace-pre-line">
                        {item.detailsEn}
                      </p>
                    </div>
                  </div>

                  {/* Solution Highlight Box */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 text-xs">
                    <div className="font-bold text-emerald-950 flex items-center space-x-1.5 mb-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>官方推荐排查与解决方案 (Resolution)</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed whitespace-pre-line font-medium">
                      {item.solutionZh}
                    </p>
                    {item.solutionEn && item.solutionEn !== item.solutionZh && (
                      <p className="text-emerald-700/80 text-[11px] mt-2 pt-2 border-t border-emerald-200/60 leading-relaxed">
                        <strong>Official advice: </strong>{item.solutionEn}
                      </p>
                    )}
                  </div>

                  {/* Collapsible Error Payload JSON */}
                  {item.examplePayload && (
                    <div>
                      <button
                        onClick={() => togglePayload(item.code)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {isPayloadOpen ? '收起标准报错 JSON 响应结构' : '查看标准报错 JSON 响应结构 (Error Payload)'}
                        </span>
                        {isPayloadOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isPayloadOpen && (
                        <div className="mt-2.5">
                          <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto shadow-inner">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">未找到匹配的 WhatsApp 错误码</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              没有找到与 &quot;<span className="text-emerald-600 font-semibold">{query}</span>&quot; 相关的记录。您可以尝试输入纯数字错误码（如 131047），或尝试如 &quot;24小时&quot;、&quot;模板&quot;、&quot;限流&quot; 等通用关键词。
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setQuery('');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                清空搜索重置
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
