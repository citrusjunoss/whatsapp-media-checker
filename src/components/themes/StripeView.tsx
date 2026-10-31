import React, { useState, useMemo, useRef } from 'react';
import { FormattedText } from '../common/FormattedText';
import { ErrorNotes } from '../common/ErrorNotes';
import {
  getLoadedErrorDataset,
  searchErrors,
  ERROR_CATEGORIES,
  ERROR_PROVIDERS,
  WhatsAppErrorItem,
  ErrorSeverity,
} from '../../core/errorEngine';
import {
  validateMediaFile,
  formatBytes,
  ValidationResult,
  CheckMode,
} from '../../core/validator';
import { ConverterPanel } from '../ConverterPanel';
import { DropZone } from '../DropZone';
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
  ChevronRight,
  ChevronLeft,
  FileText,
  Sliders,
  CheckSquare,
  Square,
  ShieldCheck,
  FolderOpen,
  ArrowRight,
  Upload,
  RefreshCw,
  Terminal,
  Activity,
  Layers,
  Wrench,
  Download,
} from 'lucide-react';
import { useTheme } from '../../core/themeContext';

interface StripeViewProps {
  activeNav: 'file_tools' | 'error_lookup';
  onNavChange: (nav: 'file_tools' | 'error_lookup') => void;
  onOpenRules: () => void;
}

export const StripeView: React.FC<StripeViewProps> = ({
  activeNav,
  onNavChange,
  onOpenRules,
}) => {
  const { setTheme } = useTheme();
  const dataset = useMemo(() => getLoadedErrorDataset(), []);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | ErrorSeverity>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Slide-over drawer state
  const [drawerItem, setDrawerItem] = useState<WhatsAppErrorItem | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string | number, Record<number, boolean>>>({});

  // Media state (Step-by-step Wizard)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaResult, setMediaResult] = useState<ValidationResult | null>(null);
  const [checkMode, setCheckMode] = useState<CheckMode>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered dataset
  const filteredErrors = useMemo(() => {
    let list = searchErrors(query, categoryFilter, dataset.items, providerFilter);
    if (severityFilter !== 'all') {
      list = list.filter((i) => i.severity === severityFilter);
    }
    return list;
  }, [query, categoryFilter, severityFilter, providerFilter, dataset.items]);

  // Pagination
  const totalPages = Math.ceil(filteredErrors.length / pageSize) || 1;
  const paginatedErrors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredErrors.slice(start, start + pageSize);
  }, [filteredErrors, currentPage, pageSize]);

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Media Inspection
  const handleInspectFile = async (file: File) => {
    setMediaFile(file);
    setIsProcessing(true);
    try {
      const res = await validateMediaFile(file, checkMode);
      setMediaResult(res);
      setWizardStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="flex bg-[#f8fafc] text-[#0f172a] min-h-[750px] rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden font-sans">
      {/* 1. Stripe Left Permanent Sidebar */}
      <aside className="w-64 bg-[#ffffff] border-r border-[#e2e8f0] p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Brand & Organization */}
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-[#635bff] flex items-center justify-center text-white font-bold text-xs">
                S
              </div>
              <span className="font-bold text-sm tracking-tight text-[#0f172a]">
                WhatsApp DevTools
              </span>
            </div>
            <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] font-mono text-[#64748b]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Graph API v26.0 (Live)</span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider px-2 mb-1">
              Developer Tools
            </div>

            <button
              onClick={() => {
                onNavChange('error_lookup');
                setDrawerItem(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'error_lookup'
                  ? 'bg-[#635bff]/10 text-[#635bff] font-semibold'
                  : 'text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span>API 错误排查目录</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#f1f5f9] text-[#64748b]">
                {dataset.totalCount}
              </span>
            </button>

            <button
              onClick={() => {
                onNavChange('file_tools');
                setDrawerItem(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeNav === 'file_tools'
                  ? 'bg-[#635bff]/10 text-[#635bff] font-semibold'
                  : 'text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>媒体合规性工作流</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded">
                WASM
              </span>
            </button>

            <button
              onClick={onOpenRules}
              className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-md text-xs font-medium text-[#475569] hover:bg-[#f1f5f9] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>官方规范速查表</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: Theme Switching */}
        <div className="pt-4 border-t border-[#e2e8f0] space-y-2 text-xs">
          <div className="text-[10px] font-bold text-[#94a3b8] uppercase">
            界面模式 (UI Shell)
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
            <button
              onClick={() => setTheme('raycast')}
              className="p-1.5 rounded border border-[#e2e8f0] bg-white hover:bg-slate-50 text-slate-700 text-center"
            >
              ⚡ Raycast
            </button>
            <button
              onClick={() => setTheme('github')}
              className="p-1.5 rounded border border-[#e2e8f0] bg-white hover:bg-slate-50 text-slate-700 text-center"
            >
              🐙 GitHub
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Stripe Main Workspace */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#f8fafc]">
        {/* Top Header Strip with Breadcrumb */}
        <header className="h-14 border-b border-[#e2e8f0] bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-[#64748b]">
            <span className="font-medium text-[#0f172a]">WhatsApp DevTools</span>
            <span>/</span>
            <span>{activeNav === 'error_lookup' ? 'API Error Directory' : 'Media Inspector Wizard'}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[#64748b] text-[11px] font-mono">
              上次同步: {dataset.lastSyncedAt.split('T')[0]}
            </span>
          </div>
        </header>

        {/* Section 1: Error Directory (Enterprise Table + Slide-over Drawer) */}
        {activeNav === 'error_lookup' ? (
          <div className="p-6 space-y-6">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-xs">
                <div className="text-[11px] font-semibold text-[#64748b] uppercase">全量官方错误</div>
                <div className="text-2xl font-bold text-[#0f172a] mt-1 font-mono">
                  {dataset.totalCount}
                </div>
                <div className="text-[11px] text-emerald-600 mt-1 flex items-center space-x-1">
                  <span>● Meta Cloud API 全量覆盖</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-xs">
                <div className="text-[11px] font-semibold text-[#64748b] uppercase">阻断性异常 (Blocker)</div>
                <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
                  {dataset.items.filter((i) => i.severity === 'blocker').length}
                </div>
                <div className="text-[11px] text-[#64748b] mt-1">需排查权限或模板配置</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-xs">
                <div className="text-[11px] font-semibold text-[#64748b] uppercase">限流频控 (Throttled)</div>
                <div className="text-2xl font-bold text-amber-600 mt-1 font-mono">
                  {dataset.items.filter((i) => i.severity === 'rate_limit').length}
                </div>
                <div className="text-[11px] text-[#64748b] mt-1">支持指数退避延迟重发</div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] shadow-xs">
                <div className="text-[11px] font-semibold text-[#64748b] uppercase">安全审计合规</div>
                <div className="text-2xl font-bold text-[#0f172a] mt-1 font-mono">
                  100%
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">纯浏览器离线计算 · 0 上报</div>
              </div>
            </div>

            {/* Table Filter Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="搜索代码 (如 131047, 192) 或故障关键词..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-md border border-[#cbd5e1] focus:border-[#635bff] focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-2.5 text-[#94a3b8] hover:text-[#0f172a]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-md border border-[#cbd5e1] bg-white text-[#334155] focus:outline-none focus:border-[#635bff]"
                >
                  {ERROR_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameZh}
                    </option>
                  ))}
                </select>

                {/* Provider select */}
                <select
                  value={providerFilter}
                  onChange={(e) => {
                    setProviderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-md border border-[#cbd5e1] bg-white text-[#334155] focus:outline-none focus:border-[#635bff]"
                >
                  {ERROR_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameZh}
                    </option>
                  ))}
                </select>

                {/* Severity select */}
                <select
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-xs rounded-md border border-[#cbd5e1] bg-white text-[#334155] focus:outline-none focus:border-[#635bff]"
                >
                  <option value="all">全部严重级别</option>
                  <option value="blocker">Blocker (阻断)</option>
                  <option value="rate_limit">Rate Limit (限流)</option>
                  <option value="service_unavailable">Outage (服务不可用)</option>
                  <option value="client_error">Client Error (入参错误)</option>
                </select>
              </div>
            </div>

            {/* Enterprise Data Table */}
            <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-xs overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-semibold text-[#64748b]">
                    <th className="py-3 px-4">代码 (CODE)</th>
                    <th className="py-3 px-4">故障描述 (TITLE)</th>
                    <th className="py-3 px-4">分类 (CATEGORY)</th>
                    <th className="py-3 px-4">严重级别</th>
                    <th className="py-3 px-4">HTTP</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {paginatedErrors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#64748b]">
                        <div className="space-y-3">
                          <div>未找到与 "{query}" 匹配的错误代码</div>
                          <a
                            href={`https://github.com/citrusjunoss/whatsapp-media-checker/issues/new?template=new_error.yml&code=${encodeURIComponent(
                              query
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-[#635bff] text-white font-medium hover:bg-[#5349e0] transition-colors"
                          >
                            <span>提交 Issue 贡献该错误</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedErrors.map((item) => (
                    <tr
                      key={item.code}
                      onClick={() => setDrawerItem(item)}
                      className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#635bff]">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              item.provider === 'aliyun'
                                ? 'bg-orange-50 text-orange-600 border border-orange-200'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            }`}
                          >
                            {item.provider === 'aliyun' ? '阿里' : 'Meta'}
                          </span>
                          <span>#{item.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0f172a]">{item.titleZh}</div>
                        <div className="text-[11px] font-mono text-[#64748b]">{item.titleEn}</div>
                      </td>
                      <td className="py-3 px-4 text-[#475569]">
                        {item.categoryNameZh}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.severity === 'blocker'
                              ? 'bg-rose-50 text-rose-600 border border-rose-200'
                              : item.severity === 'rate_limit'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : item.severity === 'service_unavailable'
                              ? 'bg-purple-50 text-purple-600 border border-purple-200'
                              : 'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}
                        >
                          {item.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#64748b]">
                        {item.httpStatus || 400}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrawerItem(item);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-[#635bff] bg-[#635bff]/10 group-hover:bg-[#635bff] group-hover:text-white transition-colors"
                        >
                          <span>排查诊断</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))) }
                </tbody>
              </table>

              {/* Pagination Bar */}
              <div className="py-3 px-4 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#64748b]">
                <div>
                  显示 {(currentPage - 1) * pageSize + 1} -{' '}
                  {Math.min(currentPage * pageSize, filteredErrors.length)} 共{' '}
                  {filteredErrors.length} 条记录
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 rounded border border-[#cbd5e1] disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 rounded border border-[#cbd5e1] disabled:opacity-40 hover:bg-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Section 2: Media Inspector (Stripe 3-Step Wizard) */
          <div className="p-6 space-y-6 max-w-4xl">
            {/* Step Stepper Header */}
            <div className="bg-white p-4 rounded-lg border border-[#e2e8f0] flex items-center justify-between">
              {[
                { num: 1, title: '1. 文件上传与嗅探' },
                { num: 2, title: '2. 官方标准矩阵比对' },
                { num: 3, title: '3. 导出合规文件' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`flex items-center space-x-2 text-xs font-semibold ${
                    wizardStep >= step.num ? 'text-[#635bff]' : 'text-[#94a3b8]'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      wizardStep >= step.num
                        ? 'bg-[#635bff] text-white'
                        : 'bg-[#f1f5f9] text-[#94a3b8]'
                    }`}
                  >
                    {step.num}
                  </span>
                  <span>{step.title}</span>
                </div>
              ))}
            </div>

            {/* Wizard Step 1: Upload & Remote URL */}
            {wizardStep === 1 && (
              <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] text-xs">
                  <span className="font-semibold text-[#0f172a]">
                    选择媒体导入源（支持本地文件投递与远程 CDN 直链探测）
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#64748b]">校验模式:</span>
                    <button
                      onClick={() => setCheckMode(checkMode === 'standard' ? 'template_header' : 'standard')}
                      className="px-2.5 py-1 rounded border border-[#cbd5e1] font-mono text-xs text-[#0f172a]"
                    >
                      {checkMode === 'standard' ? '标准消息接口' : '模板 Header 接口'}
                    </button>
                  </div>
                </div>

                <DropZone
                  mode={checkMode}
                  onFilesSelected={(files) => {
                    if (files[0]) handleInspectFile(files[0]);
                  }}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {/* Wizard Step 2: Inspection Matrix */}
            {wizardStep === 2 && mediaResult && (
              <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a]">
                      {mediaResult.fileName}
                    </h3>
                    <div className="text-xs text-[#64748b] font-mono mt-0.5">
                      {formatBytes(mediaResult.fileSize)} · {mediaResult.detectedMime}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold uppercase font-mono ${
                      mediaResult.overallStatus === 'pass'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {mediaResult.overallStatus}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {mediaResult.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#0f172a]">{item.name}</div>
                        <div className="text-[#64748b] text-[11px] mt-0.5">
                          Meta 标准: {item.expected} | 实际值: {item.actual}
                        </div>
                      </div>
                      <span
                        className={`font-mono font-bold text-[11px] ${
                          item.status === 'pass' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex justify-between pt-4 border-t border-[#e2e8f0]">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 rounded border border-[#cbd5e1] text-xs font-medium text-[#475569] hover:bg-[#f1f5f9]"
                  >
                    重新上传
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setWizardStep(3)}
                      className="px-4 py-2 rounded bg-[#635bff] text-white text-xs font-semibold hover:bg-[#5346e0] flex items-center space-x-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{mediaResult.overallStatus === 'pass' ? '进入导出与转码' : '前往智能修复转码器'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Step 3: Converted Export & Converter Panel */}
            {wizardStep === 3 && mediaResult && mediaFile && (
              <div className="bg-white p-6 rounded-lg border border-[#e2e8f0] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center space-x-2 text-xs text-[#0f172a]">
                    <span className="font-bold">WhatsApp 自动化合规转码工作台</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600">
                      WASM + Canvas 离线加速
                    </span>
                  </div>
                  <button
                    onClick={() => setWizardStep(2)}
                    className="text-xs text-[#635bff] hover:underline"
                  >
                    ← 返回规则比对
                  </button>
                </div>

                <ConverterPanel activeResult={mediaResult} file={mediaFile} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* 3. Stripe Slide-Over Drawer for Error Details */}
      {drawerItem && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[540px] bg-white border-l border-[#e2e8f0] shadow-2xl flex flex-col justify-between font-sans animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-5 border-b border-[#e2e8f0] flex items-start justify-between bg-[#f8fafc]">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-lg text-[#635bff]">
                  #{drawerItem.code}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  HTTP {drawerItem.httpStatus || 400}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    drawerItem.provider === 'aliyun'
                      ? 'bg-orange-50 text-orange-600 border border-orange-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}
                >
                  {drawerItem.providerNameZh || 'Meta 官方'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#635bff]/10 text-[#635bff]">
                  {drawerItem.categoryNameZh}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0f172a] mt-1">
                {drawerItem.titleZh}
              </h3>
              <div className="text-xs font-mono text-[#64748b]">
                {drawerItem.titleEn}
              </div>
            </div>

            <button
              onClick={() => setDrawerItem(null)}
              className="p-1 rounded text-[#94a3b8] hover:text-[#0f172a]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable) */}
          <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
            {/* SLA Advice */}
            <div className="p-3.5 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] space-y-1">
              <div className="font-semibold text-[#0f172a] text-[11px] uppercase">
                运维与重试策略 (SLA Policy)
              </div>
              <p className="text-[#475569] leading-relaxed">
                {drawerItem.severity === 'rate_limit'
                  ? '该异常由并发超频引起，允许指数退避重试（建议 5s、15s 后重发）。'
                  : '该异常需业务层代码修改或前往 Meta 业务管理平台更新配置，盲目重发仍将失败。'}
              </p>
            </div>

            <ErrorNotes item={drawerItem} />

            {/* Checklist */}
            <div className="space-y-2">
              <div className="font-semibold text-[#0f172a] text-[11px] uppercase">
                排查与解决清单 (Resolution Steps)
              </div>
              {drawerItem.solutionZh
                .split(/(?:\r?\n|;|；)/)
                .map((s) => s.trim())
                .filter((s) => s.length > 2)
                .map((step, idx) => {
                  const isChecked = !!checkedSteps[drawerItem.code]?.[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setCheckedSteps((prev) => ({
                          ...prev,
                          [drawerItem.code]: {
                            ...(prev[drawerItem.code] || {}),
                            [idx]: !prev[drawerItem.code]?.[idx],
                          },
                        }));
                      }}
                      className={`flex items-start space-x-2 p-2.5 rounded-md border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-200 line-through text-[#64748b]'
                          : 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc] text-[#0f172a]'
                      }`}
                    >
                      <button className="shrink-0 mt-0.5 text-[#635bff]">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-[#94a3b8]" />
                        )}
                      </button>
                      <span className="leading-snug">
                        <FormattedText text={step} linkColor="text-[#635bff] hover:text-[#4f46e5] underline font-medium" />
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Official Drill-down Guides & Tools */}
            {drawerItem.relatedLinks && drawerItem.relatedLinks.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold text-[#0f172a] text-[11px] uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#635bff]">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>官方二级下钻指引与工具 (Official Drill-down)</span>
                  </span>
                  <span className="text-[10px] text-[#64748b] font-normal">点击直达官方页面</span>
                </div>
                <div className="space-y-1.5">
                  {drawerItem.relatedLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between p-2.5 rounded-md border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] hover:border-[#635bff]/40 text-xs text-[#0f172a] transition-all group"
                    >
                      <span className="font-medium text-[#635bff] group-hover:underline truncate">{link.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8] group-hover:text-[#635bff] shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Reason details */}
            <div className="space-y-1">
              <div className="font-semibold text-[#0f172a] text-[11px] uppercase">
                深度故障机制 (Technical Reason)
              </div>
              <div className="p-3 rounded-md bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] leading-relaxed">
                <FormattedText text={drawerItem.detailsZh} linkColor="text-[#635bff] hover:underline" />
              </div>
            </div>

            {/* Simulated Payload */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-[11px] text-[#64748b]">
                <span>META WEBHOOK RESPONSE JSON</span>
                <button
                  onClick={() =>
                    handleCopy(
                      drawerItem.examplePayload ||
                        JSON.stringify({ error: { code: drawerItem.code, message: drawerItem.titleEn } }, null, 2),
                      'payload'
                    )
                  }
                  className="text-[#635bff] hover:underline flex items-center space-x-1"
                >
                  {copiedType === 'payload' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedType === 'payload' ? '已复制' : '复制 JSON'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-md bg-[#0f172a] text-[#94a3b8] text-[11px] overflow-x-auto">
                {drawerItem.examplePayload ||
                  JSON.stringify(
                    {
                      error: {
                        message: `(#${drawerItem.code}) ${drawerItem.titleEn}`,
                        type: 'OAuthException',
                        code: drawerItem.code,
                      },
                    },
                    null,
                    2
                  )}
              </pre>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center">
            <a
              href={drawerItem.docUrl || 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes'}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#635bff] font-semibold hover:underline flex items-center space-x-1"
            >
              <span>查阅 Meta 官方技术文档</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => setDrawerItem(null)}
              className="px-4 py-1.5 rounded-md border border-[#cbd5e1] text-xs font-semibold text-[#334155] bg-white hover:bg-[#f1f5f9]"
            >
              关闭抽屉
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
