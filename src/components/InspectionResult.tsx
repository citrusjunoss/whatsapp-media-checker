import React, { useState, useEffect } from 'react';
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
  Maximize2,
  Play,
  Layers,
} from 'lucide-react';

interface InspectionResultProps {
  result: ValidationResult;
  file?: File;
  onSelectFix: (fix: string) => void;
}

export const InspectionResult: React.FC<InspectionResultProps> = ({
  result,
  file,
  onSelectFix,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate object URL for live media inspection with zero-leak cleanup
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case 'pass':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>PASS</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>WARN</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <XCircle className="w-2.5 h-2.5" />
            <span>BLOCKED</span>
          </span>
        );
    }
  };

  return (
    <div className="app-surface rounded-lg border app-border overflow-hidden transition-colors shadow-xs">
      {/* Verdict Header */}
      <div className="p-3.5 border-b app-border app-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-md app-surface border app-border flex items-center justify-center flex-shrink-0">
            {getStatusIcon(result.overallStatus)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                  result.overallStatus === 'pass'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : result.overallStatus === 'warning'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                }`}
              >
                {result.overallStatus === 'pass'
                  ? 'COMPLIANT (合规)'
                  : result.overallStatus === 'warning'
                  ? 'OPTIMIZE_RECOMMENDED'
                  : 'BLOCKED (阻断不合规)'}
              </span>
              <span className="text-[11px] font-mono app-text-dim">
                {result.mode === 'template_header' ? 'MODE: TEMPLATE_HEADER' : 'MODE: STANDARD_MEDIA'}
              </span>
            </div>
            <h3 className="text-sm font-bold app-text-main font-mono truncate mt-0.5" title={result.fileName}>
              {result.fileName}
            </h3>
          </div>
        </div>

        {/* Quick status reason pill */}
        <div className="text-xs font-mono app-text-muted bg-black/10 dark:bg-black/20 px-2.5 py-1 rounded border app-border self-start sm:self-auto">
          {result.statusReason}
        </div>
      </div>

      {/* Live Media Player & Real Asset Preview */}
      {previewUrl && (
        <div className="p-3.5 border-b app-border bg-black/5 dark:bg-black/30">
          <div className="text-[11px] font-mono font-bold app-text-dim mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Play className="w-3 h-3 text-emerald-500" />
              <span>LIVE_MEDIA_PREVIEW (实时画面与音画校验)</span>
            </span>
            <span className="text-[10px] text-emerald-500/80">CLIENT_RENDERED</span>
          </div>

          <div className="rounded-md overflow-hidden bg-black/40 border app-border flex items-center justify-center min-h-[160px] max-h-[220px] w-full relative">
            {result.detectedCategory === 'video' ? (
              <video
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full max-h-[220px] object-contain aspect-video"
              />
            ) : result.detectedCategory === 'image' || result.detectedCategory === 'sticker' ? (
              <img
                src={previewUrl}
                alt={result.fileName}
                className="w-full h-full max-h-[220px] object-contain p-1"
              />
            ) : result.detectedCategory === 'audio' ? (
              <div className="p-4 w-full flex flex-col items-center justify-center space-y-2">
                <Volume2 className="w-8 h-8 text-amber-500 animate-pulse" />
                <audio src={previewUrl} controls className="w-full max-w-md" />
              </div>
            ) : (
              <div className="p-4 text-center">
                <FileText className="w-10 h-10 text-emerald-500 mx-auto mb-1" />
                <span className="text-xs font-mono app-text-muted">{result.fileName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Diagnostic Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b app-border divide-x app-border text-xs font-mono">
        <div className="p-2.5 app-surface-subtle">
          <div className="text-[10px] uppercase app-text-dim">
            {result.detectedCategory === 'video' ? 'H.264 Profile 规格' : 'MIME 类型 (Sniffed)'}
          </div>
          <div className="font-semibold app-text-main truncate mt-0.5" title={result.detectedMime}>
            {result.detectedCategory === 'video' ? (
              <span className="flex items-center space-x-1">
                <span>{result.metadata?.video?.h264Profile ? `H.264 ${result.metadata.video.h264Profile}` : 'H.264 (AVC1)'}</span>
                {result.metadata?.video?.h264Profile === 'Main' && (
                  <span className="text-[10px] text-emerald-500 font-normal">[推荐]</span>
                )}
                {result.metadata?.video?.h264Profile === 'High' && (
                  <span className="text-[10px] text-amber-500 font-normal">[需注意]</span>
                )}
              </span>
            ) : (
              result.detectedMime || 'unknown'
            )}
          </div>
        </div>

        <div className="p-2.5 app-surface-subtle">
          <div className="text-[10px] uppercase app-text-dim">文件体积 (Size)</div>
          <div className="font-semibold app-text-main mt-0.5 flex items-center space-x-1.5">
            <span>{formatBytes(result.fileSize)}</span>
            {result.detectedCategory === 'video' && (
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                  result.fileSize <= 16 * 1024 * 1024
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-rose-500 bg-rose-500/10'
                }`}
              >
                {result.fileSize <= 16 * 1024 * 1024 ? '≤ 16MB' : '> 16MB 超标'}
              </span>
            )}
          </div>
        </div>

        <div className="p-2.5 app-surface-subtle">
          <div className="text-[10px] uppercase app-text-dim">
            {result.detectedCategory === 'video' ? 'B-frames (双向预测)' : '分辨率 / 尺寸'}
          </div>
          <div className="font-semibold app-text-main mt-0.5">
            {result.detectedCategory === 'video' ? (
              result.metadata?.video?.hasBframes === true ? (
                <span className="text-amber-500 font-bold flex items-center space-x-1">
                  <span>包含 B-frames</span>
                  <span className="text-[10px] font-normal text-amber-400/80">(建议移除)</span>
                </span>
              ) : result.metadata?.video?.hasBframes === false ? (
                <span className="text-emerald-500 font-bold flex items-center space-x-1">
                  <span>无 B-frames</span>
                  <span className="text-[10px] font-normal text-emerald-400/80">(官方推荐)</span>
                </span>
              ) : (
                '未检测到'
              )
            ) : result.metadata?.width && result.metadata?.height ? (
              `${result.metadata.width} × ${result.metadata.height}`
            ) : (
              'N/A'
            )}
          </div>
        </div>

        <div className="p-2.5 app-surface-subtle">
          <div className="text-[10px] uppercase app-text-dim">视频 / 音频结构</div>
          <div className="font-semibold app-text-main mt-0.5 truncate">
            {result.detectedCategory === 'video'
              ? `${result.metadata?.hasFastStart ? 'FastStart: YES' : 'FastStart: NO'}${
                  result.metadata?.duration ? ` · ${result.metadata.duration.toFixed(1)}s` : ''
                }`
              : result.metadata?.duration
              ? `${result.metadata.duration.toFixed(1)}s`
              : 'NORMAL'}
          </div>
        </div>
      </div>

      {/* Detailed Meta Specification Rule Matrix Table */}
      <div className="p-3.5 space-y-2">
        <div className="text-xs font-mono font-bold app-text-dim uppercase tracking-wider flex items-center justify-between">
          <span>RULE_COMPLIANCE_MATRIX (WhatsApp 官方准则核验)</span>
          <span className="text-[11px] font-normal app-text-muted">
            {result.items.filter((i) => i.status === 'pass').length}/{result.items.length} 通过
          </span>
        </div>

        <div className="border app-border rounded-md overflow-hidden">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="app-surface-subtle border-b app-border text-[11px] app-text-dim text-left">
                <th className="py-2 px-3 font-semibold">检查项</th>
                <th className="py-2 px-3 font-semibold hidden sm:table-cell">Meta 官方标准</th>
                <th className="py-2 px-3 font-semibold">实际检测值</th>
                <th className="py-2 px-3 font-semibold text-center">状态</th>
                <th className="py-2 px-3 font-semibold text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y app-border">
              {result.items.map((item, idx) => {
                let suggestedFix: string | null = null;
                if (item.status !== 'pass') {
                  if (item.id.includes('sticker') || item.id === 'dimensions_sticker') {
                    suggestedFix = 'make_sticker';
                  } else if (item.id.includes('image_size') || item.id.includes('compress')) {
                    suggestedFix = 'compress_image';
                  } else if (item.id.includes('faststart') || item.id.includes('moov')) {
                    suggestedFix = 'fix_faststart';
                  } else if (item.id.includes('video') || item.id.includes('codec')) {
                    suggestedFix = 'transcode_video_ffmpeg';
                  } else if (item.id.includes('audio')) {
                    suggestedFix = 'convert_audio_mp3';
                  } else if (item.id.includes('pdf') || item.id.includes('doc')) {
                    suggestedFix = 'convert_to_pdf';
                  } else {
                    suggestedFix = result.availableFixes[0] || null;
                  }
                }

                return (
                  <tr
                    key={idx}
                    className={`app-surface transition-colors ${
                      item.status === 'error'
                        ? 'bg-rose-500/5'
                        : item.status === 'warning'
                        ? 'bg-amber-500/5'
                        : 'hover:app-surface-subtle'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold app-text-main align-top">
                      <div className="flex items-center space-x-1.5">
                        {getStatusIcon(item.status)}
                        <span>{item.name}</span>
                      </div>
                      {item.message && item.status !== 'pass' && (
                        <div className="text-[11px] font-normal app-text-muted mt-0.5 pl-5">
                          {item.message}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3 app-text-muted align-top hidden sm:table-cell text-[11px]">
                      {item.expected}
                    </td>

                    <td className="py-2.5 px-3 app-text-main align-top text-[11px]">
                      <span className={item.status === 'error' ? 'text-rose-500 font-semibold' : ''}>
                        {item.actual}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center align-top">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="py-2.5 px-3 text-right align-top">
                      {suggestedFix ? (
                        <button
                          onClick={() => onSelectFix(suggestedFix!)}
                          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 transition-all active:scale-95 cursor-pointer"
                          title="立即在下方操作台展开修复工具"
                        >
                          <Wrench className="w-2.5 h-2.5" />
                          <span>修复</span>
                        </button>
                      ) : (
                        <span className="app-text-dim text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
