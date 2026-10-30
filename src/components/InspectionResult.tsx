import React from 'react';
import {
  ValidationResult,
  CheckStatus,
  CheckItem,
  formatBytes,
} from '../core/validator';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Wrench,
  Clock,
  Video,
  FileText,
  Volume2,
  Smile,
  ImageIcon,
} from 'lucide-react';

interface InspectionResultProps {
  result: ValidationResult;
  onSelectFix: (fix: string) => void;
}

export const InspectionResult: React.FC<InspectionResultProps> = ({
  result,
  onSelectFix,
}) => {
  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-purple-500" />;
      case 'audio':
        return <Volume2 className="w-3.5 h-3.5 text-amber-500" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-emerald-500" />;
      case 'sticker':
        return <Smile className="w-3.5 h-3.5 text-pink-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="app-surface rounded-lg border app-border overflow-hidden transition-colors">
      {/* Overall Verdict Header */}
      <div className="px-4 py-3 border-b app-border app-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md app-surface border app-border flex items-center justify-center">
            {getStatusIcon(result.overallStatus)}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                  result.overallStatus === 'pass'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : result.overallStatus === 'warning'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                }`}
              >
                {result.overallStatus === 'pass'
                  ? 'COMPLIANT'
                  : result.overallStatus === 'warning'
                  ? 'WARN_OPTIMIZE'
                  : 'BLOCKED'}
              </span>
              <span className="text-[11px] font-mono app-text-dim">
                {result.mode === 'template_header' ? 'RULE: TEMPLATE_HEADER' : 'RULE: STANDARD_MEDIA'}
              </span>
            </div>

            <h3 className="text-sm font-bold app-text-main font-mono mt-0.5 truncate max-w-md">
              {result.fileName}
            </h3>

            <p className="text-xs app-text-muted mt-0.5 font-mono">
              {result.statusReason}
            </p>
          </div>
        </div>

        {result.availableFixes.length > 0 && (
          <button
            onClick={() => onSelectFix(result.availableFixes[0])}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors shadow-xs self-start sm:self-auto"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>REPAIR_CONVERT</span>
          </button>
        )}
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border-b app-border app-surface-subtle font-mono text-xs">
        <div className="app-surface p-2.5 rounded border app-border">
          <div className="flex items-center space-x-1.5 app-text-dim text-[11px] mb-0.5">
            {getCategoryIcon(result.detectedCategory)}
            <span>CATEGORY</span>
          </div>
          <div className="font-bold app-text-main capitalize">
            {result.detectedCategory}
          </div>
          <div className="text-[10px] app-text-dim truncate">
            {result.detectedMime}
          </div>
        </div>

        <div className="app-surface p-2.5 rounded border app-border">
          <div className="app-text-dim text-[11px] mb-0.5">SIZE</div>
          <div className="font-bold app-text-main">
            {formatBytes(result.fileSize)}
          </div>
          <div className="text-[10px] app-text-dim">
            {result.detectedCategory === 'image'
              ? 'LIMIT: ≤ 5 MB'
              : result.detectedCategory === 'video' || result.detectedCategory === 'audio'
              ? 'LIMIT: ≤ 16 MB'
              : result.detectedCategory === 'sticker'
              ? 'LIMIT: ≤ 100 KB'
              : 'LIMIT: ≤ 100 MB'}
          </div>
        </div>

        <div className="app-surface p-2.5 rounded border app-border">
          <div className="app-text-dim text-[11px] mb-0.5">DIMENSIONS / DURATION</div>
          <div className="font-bold app-text-main truncate">
            {result.metadata.width && result.metadata.height
              ? `${result.metadata.width}×${result.metadata.height}`
              : result.metadata.duration
              ? `${result.metadata.duration}s`
              : 'N/A'}
          </div>
          <div className="text-[10px] app-text-dim">
            {result.metadata.aspectRatio
              ? `RATIO: ${result.metadata.aspectRatio}`
              : result.metadata.sampleRate
              ? `${result.metadata.sampleRate} Hz`
              : 'STATIC'}
          </div>
        </div>

        <div className="app-surface p-2.5 rounded border app-border">
          <div className="app-text-dim text-[11px] mb-0.5">CODEC &amp; FASTSTART</div>
          <div className="font-bold app-text-main truncate">
            {result.metadata.videoCodec || (result.detectedCategory === 'sticker' ? 'WEBP' : 'STANDARD')}
          </div>
          <div className="text-[10px] app-text-dim">
            {result.metadata.hasFastStart !== undefined
              ? result.metadata.hasFastStart
                ? 'MOOV_IN_FRONT'
                : 'NO_FASTSTART'
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Rules Matrix List */}
      <div className="p-3 space-y-1.5 font-mono text-xs">
        <div className="text-[11px] font-bold app-text-dim uppercase px-1">
          RULE_CHECK_MATRIX ({result.items.length} CHECKS)
        </div>

        <div className="divide-y app-border border rounded app-surface">
          {result.items.map((item: CheckItem) => (
            <div
              key={item.id}
              className={`p-3 flex items-start justify-between space-x-3 transition-colors ${
                item.status === 'error'
                  ? 'bg-rose-500/5'
                  : item.status === 'warning'
                  ? 'bg-amber-500/5'
                  : ''
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold app-text-main">{item.name}</span>
                    {item.docUrl && (
                      <a
                        href={item.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="app-text-dim hover:app-text-main"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="app-text-muted text-[11px] mt-0.5 font-sans leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>

              <div className="text-right text-[11px] flex-shrink-0 font-mono">
                <div className="app-text-dim text-[10px]">EXPECTED</div>
                <div className="app-text-muted">{item.expected}</div>
                <div className="app-text-dim text-[10px] mt-1">ACTUAL</div>
                <div
                  className={`font-bold ${
                    item.status === 'error'
                      ? 'text-rose-500'
                      : item.status === 'warning'
                      ? 'text-amber-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {item.actual}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div className="p-3 rounded border app-border app-surface-subtle text-xs space-y-1 font-sans">
            <div className="font-bold app-text-main font-mono text-[11px]">
              ACTIONABLE_SUGGESTIONS:
            </div>
            <ul className="list-disc list-inside space-y-0.5 app-text-muted text-xs">
              {result.suggestions.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
