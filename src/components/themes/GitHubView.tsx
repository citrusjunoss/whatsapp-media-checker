import React, { useState, useMemo, useRef } from 'react';
import { FormattedText } from '../common/FormattedText';
import {
  getLoadedErrorDataset,
  searchErrors,
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
  CircleDot,
  CheckCircle2,
  GitPullRequest,
  Code,
  Star,
  GitFork,
  Eye,
  Tag,
  MessageSquare,
  Sparkles,
  Terminal,
  Upload,
  Download,
  CheckSquare,
  Square,
  FileText,
  Bookmark,
} from 'lucide-react';
import { useTheme } from '../../core/themeContext';
import { DropZone } from '../DropZone';
import { ConverterPanel } from '../ConverterPanel';

interface GitHubViewProps {
  activeNav: 'file_tools' | 'error_lookup';
  onNavChange: (nav: 'file_tools' | 'error_lookup') => void;
  onOpenRules: () => void;
}

export const GitHubView: React.FC<GitHubViewProps> = ({
  activeNav,
  onNavChange,
  onOpenRules,
}) => {
  const { setTheme } = useTheme();
  const dataset = useMemo(() => getLoadedErrorDataset(), []);

  const [query, setQuery] = useState('');
  const [labelFilter, setLabelFilter] = useState<'all' | 'blocker' | 'rate_limit' | 'template' | 'auth'>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Selected Issue for GitHub Discussion view
  const [selectedIssue, setSelectedIssue] = useState<WhatsAppErrorItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string | number, Record<number, boolean>>>({});

  // Media state (PR Diff view)
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaResult, setMediaResult] = useState<ValidationResult | null>(null);
  const [checkMode, setCheckMode] = useState<CheckMode>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered issues
  const filteredIssues = useMemo(() => {
    let list = searchErrors(query, 'all', dataset.items, providerFilter);
    if (labelFilter === 'blocker') {
      list = list.filter((i) => i.severity === 'blocker');
    } else if (labelFilter === 'rate_limit') {
      list = list.filter((i) => i.severity === 'rate_limit');
    } else if (labelFilter === 'template') {
      list = list.filter((i) => i.category === 'template');
    } else if (labelFilter === 'auth') {
      list = list.filter((i) => i.category === 'authentication');
    }
    return list;
  }, [query, labelFilter, providerFilter, dataset.items]);

  const handleInspectMedia = async (file: File) => {
    setMediaFile(file);
    try {
      const res = await validateMediaFile(file, checkMode);
      setMediaResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const copyFeedback = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded-xl shadow-md overflow-hidden font-sans">
      {/* 1. GitHub Repository Header */}
      <div className="bg-[#161b22] border-b border-[#30363d] p-4 space-y-4">
        {/* Repo title & action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-sm">
            <Bookmark className="w-4 h-4 text-[#8b949e]" />
            <span className="text-[#58a6ff] hover:underline cursor-pointer font-semibold">
              citrusjunoss
            </span>
            <span className="text-[#8b949e]">/</span>
            <span className="font-bold text-white">whatsapp-media-checker</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-[#30363d] text-[#8b949e]">
              Public
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-medium">
            <a
              href="https://github.com/citrusjunoss/whatsapp-media-checker"
              target="_blank"
              rel="noreferrer"
              title="在 GitHub 上给 whatsapp-media-checker 点赞 Star"
              className="flex items-center border border-[#30363d] rounded-md bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] divide-x divide-[#30363d] transition-all cursor-pointer"
            >
              <span className="px-2.5 py-1 text-slate-200 flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Star</span>
              </span>
              <span className="px-2 py-1 font-mono text-[#8b949e]">12</span>
            </a>

            <a
              href="https://github.com/citrusjunoss/whatsapp-media-checker/fork"
              target="_blank"
              rel="noreferrer"
              title="在 GitHub 上 Fork 此项目"
              className="flex items-center border border-[#30363d] rounded-md bg-[#21262d] hover:bg-[#30363d] hover:border-[#8b949e] divide-x divide-[#30363d] transition-all cursor-pointer"
            >
              <span className="px-2.5 py-1 text-slate-200 flex items-center space-x-1">
                <GitFork className="w-3.5 h-3.5 text-[#8b949e]" />
                <span>Fork</span>
              </span>
              <span className="px-2 py-1 font-mono text-[#8b949e]">3</span>
            </a>

            {/* Theme switcher */}
            <div className="border-l border-[#30363d] pl-2 flex items-center space-x-1">
              <button
                onClick={() => setTheme('raycast')}
                className="px-2 py-1 rounded text-[11px] bg-[#21262d] hover:bg-[#30363d] text-slate-300"
              >
                ⚡ Raycast
              </button>
              <button
                onClick={() => setTheme('stripe')}
                className="px-2 py-1 rounded text-[11px] bg-[#21262d] hover:bg-[#30363d] text-slate-300"
              >
                💳 Stripe
              </button>
            </div>
          </div>
        </div>

        {/* GitHub Navigation Tabs */}
        <div className="flex items-center space-x-4 border-b border-transparent -mb-4 pt-1 text-xs">
          <button
            onClick={() => {
              onNavChange('error_lookup');
              setSelectedIssue(null);
            }}
            className={`pb-3 flex items-center space-x-2 border-b-2 font-medium transition-colors ${
              activeNav === 'error_lookup'
                ? 'border-[#f78166] text-white font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <CircleDot className="w-4 h-4 text-[#3fb950]" />
            <span>Issues</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#30363d] text-[11px] font-mono text-[#c9d1d9]">
              {dataset.totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              onNavChange('file_tools');
              setSelectedIssue(null);
            }}
            className={`pb-3 flex items-center space-x-2 border-b-2 font-medium transition-colors ${
              activeNav === 'file_tools'
                ? 'border-[#f78166] text-white font-semibold'
                : 'border-transparent text-[#8b949e] hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code (Media PR Diff)</span>
          </button>

          <button
            onClick={onOpenRules}
            className="pb-3 flex items-center space-x-1.5 text-[#8b949e] hover:text-white transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Rules Specs</span>
          </button>
        </div>
      </div>

      {/* 2. GitHub Tab: Issues Tracker */}
      {activeNav === 'error_lookup' && (
        <div className="p-5 space-y-4">
          {!selectedIssue ? (
            /* Issues List View */
            <div className="space-y-3">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="is:issue is:open (搜索错误代码如 131047, 192 或关键词)..."
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-md pl-8 pr-8 py-1.5 text-xs font-mono text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-2 text-[#8b949e] hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Provider filters & Label filters */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <div className="flex items-center space-x-1 border-r border-[#30363d] pr-2">
                    <span className="text-[#8b949e]">Provider:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'meta', label: 'Meta' },
                      { id: 'aliyun', label: '阿里 ChatApp' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProviderFilter(p.id)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          providerFilter === p.id
                            ? 'bg-[#30363d] text-emerald-400 border-emerald-500/50 font-bold'
                            : 'border-[#30363d] text-[#8b949e] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-[#8b949e]">Labels:</span>
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'blocker', label: 'bug: blocker' },
                      { id: 'rate_limit', label: 'rate-limit' },
                      { id: 'template', label: 'template' },
                      { id: 'auth', label: 'auth' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLabelFilter(l.id as any)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          labelFilter === l.id
                            ? 'bg-[#30363d] text-white border-[#8b949e]'
                            : 'border-[#30363d] text-[#8b949e] hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* GitHub Issues Container */}
              <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]">
                {/* Issues Header */}
                <div className="p-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e] font-medium">
                  <div className="flex items-center space-x-2">
                    <CircleDot className="w-4 h-4 text-[#3fb950]" />
                    <span className="font-bold text-white">
                      {filteredIssues.length} Open
                    </span>
                    <span>· 0 Closed</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[11px] font-mono hidden md:inline">Multi-Provider Registry</span>
                    <a
                      href="https://github.com/citrusjunoss/whatsapp-media-checker/issues/new?template=new_error.yml"
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md text-[11px] font-semibold transition-colors flex items-center space-x-1"
                    >
                      <span>New Error Issue</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Issues Rows */}
                <div className="divide-y divide-[#30363d]">
                  {filteredIssues.length === 0 ? (
                    <div className="p-8 text-center space-y-3 font-mono">
                      <div className="text-xs text-[#8b949e]">No issues matching "{query}"</div>
                      <a
                        href={`https://github.com/citrusjunoss/whatsapp-media-checker/issues/new?template=new_error.yml&code=${encodeURIComponent(
                          query
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        <span>Submit New Error Issue</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  ) : (
                    filteredIssues.map((item) => (
                      <div
                        key={`${item.provider || 'meta'}_${item.code}`}
                        onClick={() => setSelectedIssue(item)}
                        className="p-3.5 hover:bg-[#161b22] transition-colors cursor-pointer flex items-start space-x-3"
                      >
                        <CircleDot className="w-4 h-4 text-[#3fb950] shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-white hover:text-[#58a6ff]">
                              {item.titleZh}
                            </span>

                            {/* GitHub Labels */}
                            <span
                              className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                                item.provider === 'aliyun'
                                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              }`}
                            >
                              provider: {item.provider || 'meta'}
                            </span>

                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#f85149]/20 text-[#ff7b72] border border-[#f85149]/30">
                              #{item.code}
                            </span>

                            <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#1f6feb]/20 text-[#58a6ff] border border-[#1f6feb]/30">
                              {item.category}
                            </span>

                            {item.severity === 'blocker' && (
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/30">
                                severity: blocker
                              </span>
                            )}

                            {item.severity === 'rate_limit' && (
                              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#d29922]/20 text-[#e3b341] border border-[#d29922]/30">
                                sla: throttled
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-[#8b949e] font-mono">
                            #{item.code} · {item.providerNameZh || 'Meta WhatsApp 官方'} · HTTP{' '}
                            {item.httpStatus || 400}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Selected Issue Thread View */
            <div className="space-y-4 max-w-4xl">
              {/* Issue Title & Header */}
              <div className="pb-3 border-b border-[#30363d] flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center space-x-2">
                    <span>{selectedIssue.titleZh}</span>
                    <span className="text-[#8b949e] font-mono font-normal">
                      #{selectedIssue.code}
                    </span>
                  </h1>
                  <div className="flex items-center space-x-2 mt-2 text-xs font-mono text-[#8b949e]">
                    <span className="px-2 py-0.5 rounded-full bg-[#238636] text-white flex items-center space-x-1 font-semibold">
                      <CircleDot className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </span>
                    <span>meta-graph-api opened this issue · 2 comments</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedIssue(null)}
                  className="px-3 py-1.5 rounded-md border border-[#30363d] bg-[#21262d] text-xs font-medium text-slate-300 hover:bg-[#30363d]"
                >
                  ← 返回 Issues 列表
                </button>
              </div>

              {/* Comment 1: Meta Bot Bug Report */}
              <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]">
                <div className="p-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">meta-graph-api[bot]</span>
                    <span>commented 2 days ago</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#30363d]">
                    BOT
                  </span>
                </div>
                <div className="p-4 space-y-3 text-xs leading-relaxed text-[#c9d1d9]">
                  <p className="font-semibold text-white">
                    ### Official Error Description
                  </p>
                  <blockquote className="p-3 border-l-4 border-[#30363d] bg-[#161b22] text-[#8b949e] font-mono text-xs">
                    {selectedIssue.detailsEn}
                  </blockquote>
                  <p>{selectedIssue.detailsZh}</p>
                </div>
              </div>

              {/* Comment 2: WhatsApp Dev Bot Checklist */}
              <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117]">
                <div className="p-3 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between text-xs text-[#8b949e]">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">whatsapp-dev[bot]</span>
                    <span>suggested troubleshooting steps</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    RESOLVER
                  </span>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div className="font-semibold text-white">
                    ### Actionable Checklist (- [ ])
                  </div>

                  <div className="space-y-1.5 font-mono">
                    {selectedIssue.solutionZh
                      .split(/(?:\r?\n|;|；)/)
                      .map((s) => s.trim())
                      .filter((s) => s.length > 2)
                      .map((step, idx) => {
                        const isChecked = !!checkedItems[selectedIssue.code]?.[idx];
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setCheckedItems((prev) => ({
                                ...prev,
                                [selectedIssue.code]: {
                                  ...(prev[selectedIssue.code] || {}),
                                  [idx]: !prev[selectedIssue.code]?.[idx],
                                },
                              }));
                            }}
                            className={`p-2 rounded cursor-pointer flex items-start space-x-2 border transition-colors ${
                              isChecked
                                ? 'bg-emerald-500/10 border-emerald-500/30 line-through text-[#8b949e]'
                                : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]'
                            }`}
                          >
                            <button className="shrink-0 mt-0.5 text-[#3fb950]">
                              {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                            <span>
                              <FormattedText text={step} linkColor="text-[#58a6ff] hover:text-[#79c0ff] underline font-medium" />
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Official Sub-page Drilldown Links */}
                  {selectedIssue.relatedLinks && selectedIssue.relatedLinks.length > 0 && (
                    <div className="pt-2 space-y-1.5 font-mono border-t border-[#30363d]">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-[#58a6ff]" />
                        <span>### 🔗 Official Drill-down Guides & Tools (二级下钻指引)</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-[#8b949e] pl-1">
                        {selectedIssue.relatedLinks.map((link, idx) => (
                          <li key={idx} className="truncate">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-[#58a6ff] hover:underline inline-flex items-center gap-1 ml-1"
                            >
                              <span>{link.title}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Unified Diff Box */}
                  <div className="pt-2">
                    <div className="font-semibold text-white mb-1.5">
                      ### Suggested Payload Fix Diff
                    </div>
                    <pre className="p-3 rounded-md bg-[#161b22] border border-[#30363d] font-mono text-xs overflow-x-auto text-[#8b949e]">
                      {`--- a/message_payload.json (Rejected by Meta)
+++ b/message_payload.json (Accepted Fix)
@@ -1,5 +1,8 @@
 {
   "messaging_product": "whatsapp",
-  "type": "text",
-  "text": { "body": "Freeform message after 24h window" }
+  "type": "template",
+  "template": {
+    "name": "account_update_v1",
+    "language": { "code": "en_US" }
+  }
 }`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. GitHub Tab: Code & PR Diff View for Media */}
      {activeNav === 'file_tools' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-mono text-[#8b949e]">
              <span className="text-[#58a6ff]">whatsapp-media-checker</span>
              <span>/</span>
              <span className="text-white">media</span>
              <span>/</span>
              <span>{mediaFile ? mediaFile.name : 'upload_target'}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCheckMode(checkMode === 'standard' ? 'template_header' : 'standard')}
                className="px-2.5 py-1 rounded border border-[#30363d] bg-[#21262d] font-mono text-xs text-slate-300"
              >
                Mode: {checkMode === 'standard' ? 'Standard' : 'Template Header'}
              </button>
            </div>
          </div>

          {/* Media Input DropZone (Supports Local Drag + Remote URL) */}
          <div className="border border-[#30363d] rounded-lg p-3 bg-[#161b22]/70">
            <DropZone
              mode={checkMode}
              onFilesSelected={(files) => {
                if (files[0]) handleInspectMedia(files[0]);
              }}
              isProcessing={false}
            />
          </div>

          {/* GitHub PR Diff Table & Transcode Panel */}
          {mediaResult && (
            <>
              <div className="border border-[#30363d] rounded-md overflow-hidden bg-[#0d1117] font-mono text-xs">
                <div className="p-2.5 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between">
                  <span className="font-bold text-white">
                    diff --git a/{mediaResult.fileName} b/whatsapp_compliance_spec
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      mediaResult.overallStatus === 'pass'
                        ? 'bg-[#238636] text-white'
                        : 'bg-[#da3633] text-white'
                    }`}
                  >
                    {mediaResult.overallStatus === 'pass' ? 'PASSED 6/6 RULES' : 'DIFF CONFLICTS DETECTED'}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  {mediaResult.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="text-[11px] text-[#8b949e] font-semibold">
                        @@ -{idx + 1},1 +{idx + 1},1 @@ {item.name}
                      </div>
                      {item.status !== 'pass' && (
                        <div className="p-1.5 bg-[#f85149]/10 text-[#ff7b72] rounded">
                          - Actual: {item.actual} ({item.message})
                        </div>
                      )}
                      <div className="p-1.5 bg-[#2ea043]/10 text-[#7ee787] rounded">
                        + Target Spec: {item.expected}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub Repair & Transcode Panel */}
              {mediaFile && (
                <div className="pt-2">
                  <ConverterPanel activeResult={mediaResult} file={mediaFile} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
