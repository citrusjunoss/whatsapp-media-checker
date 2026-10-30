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
  FileCheck,
  FileWarning,
  ExternalLink,
  Wrench,
  Info,
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
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Volume2 className="w-5 h-5 text-amber-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'sticker':
        return <Smile className="w-5 h-5 text-pink-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Overall Verdict Banner */}
      <div
        className={`px-6 py-5 border-b ${
          result.overallStatus === 'pass'
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
            : result.overallStatus === 'warning'
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
            : 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow ${
                result.overallStatus === 'pass'
                  ? 'bg-emerald-600'
                  : result.overallStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-rose-600'
              }`}
            >
              {result.overallStatus === 'pass' ? (
                <FileCheck className="w-6 h-6" />
              ) : (
                <FileWarning className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    result.overallStatus === 'pass'
                      ? 'bg-emerald-100 text-emerald-800'
                      : result.overallStatus === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {result.overallStatus === 'pass'
                    ? '检测通过 · 完全兼容'
                    : result.overallStatus === 'warning'
                    ? '可发送 · 建议优化'
                    : '检测拦截 · 不兼容'}
                </span>
                <span className="text-xs text-slate-500">
                  {result.mode === 'template_header' ? '模板 Header 规则' : '标准媒体规则'}
                </span>
              </div>

              <h2 className="text-base font-bold text-slate-900 mt-1 truncate max-w-xl">
                {result.fileName}
              </h2>

              <p
                className={`text-xs mt-1 font-medium ${
                  result.overallStatus === 'pass'
                    ? 'text-emerald-800'
                    : result.overallStatus === 'warning'
                    ? 'text-amber-800'
                    : 'text-rose-800'
                }`}
              >
                {result.statusReason}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          {result.availableFixes.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectFix(result.availableFixes[0])}
                className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition-all"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>一键修复 / 转换</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50/60 border-b border-slate-200/60">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            {getCategoryIcon(result.detectedCategory)}
            <span>媒体分类</span>
          </div>
          <div className="text-sm font-bold text-slate-900 capitalize">
            {result.detectedCategory}
          </div>
          <div className="text-[11px] text-slate-500 truncate" title={result.detectedMime}>
            {result.detectedMime}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Info className="w-4 h-4 text-slate-400" />
            <span>文件大小</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {formatBytes(result.fileSize)}
          </div>
          <div className="text-[11px] text-slate-500">
            {result.detectedCategory === 'image'
              ? '限额 ≤ 5 MB'
              : result.detectedCategory === 'video' || result.detectedCategory === 'audio'
              ? '限额 ≤ 16 MB'
              : result.detectedCategory === 'sticker'
              ? '限额 ≤ 100 KB'
              : '限额 ≤ 100 MB'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Video className="w-4 h-4 text-slate-400" />
            <span>分辨率 / 时长</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {result.metadata.width && result.metadata.height
              ? `${result.metadata.width} × ${result.metadata.height} px`
              : result.metadata.duration
              ? `${result.metadata.duration} 秒`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            {result.metadata.aspectRatio
              ? `宽高比 ${result.metadata.aspectRatio}`
              : result.metadata.duration
              ? `音频采样率 ${result.metadata.sampleRate || 44100}Hz`
              : '静态文件'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>编码与 FastStart</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {result.metadata.videoCodec
              ? result.metadata.videoCodec
              : result.detectedCategory === 'sticker'
              ? 'WebP 贴纸'
              : '标准格式'}
          </div>
          <div className="text-[11px] text-slate-500">
            {result.metadata.hasFastStart !== undefined
              ? result.metadata.hasFastStart
                ? '✅ FastStart 已开启'
                : '⚠️ 未开启 FastStart'
              : '无需 moov 优化'}
          </div>
        </div>
      </div>

      {/* Detailed Check Checklist Table */}
      <div className="p-6">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          规则校验详细矩阵（{result.items.length} 项检测）
        </h3>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {result.items.map((item: CheckItem) => (
            <div
              key={item.id}
              className={`p-4 transition-colors flex items-start justify-between space-x-4 ${
                item.status === 'error'
                  ? 'bg-rose-50/40'
                  : item.status === 'warning'
                  ? 'bg-amber-50/30'
                  : 'bg-white hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getStatusIcon(item.status)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {item.name}
                    </span>
                    {item.docUrl && (
                      <a
                        href={item.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="查看 Meta 官方文档说明"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{item.message}</p>
                </div>
              </div>

              <div className="text-right text-xs flex-shrink-0">
                <div className="text-slate-400 text-[10px]">Meta 期望</div>
                <div className="font-medium text-slate-700">{item.expected}</div>
                <div className="text-slate-400 text-[10px] mt-1">检测实际值</div>
                <div
                  className={`font-mono text-[11px] font-semibold ${
                    item.status === 'error'
                      ? 'text-rose-600'
                      : item.status === 'warning'
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {item.actual}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions Card */}
        {result.suggestions.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs">
            <div className="font-bold flex items-center space-x-1.5 mb-1.5">
              <Info className="w-4 h-4 text-blue-600" />
              <span>修复与优化建议</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
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
