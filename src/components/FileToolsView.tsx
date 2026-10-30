import React, { useState } from 'react';
import { CheckMode, ValidationResult } from '../core/rules';
import { validateMediaFile } from '../core/validator';
import { DropZone } from './DropZone';
import { InspectionResult } from './InspectionResult';
import { ConverterPanel } from './ConverterPanel';
import { ApiHelperPanel } from './ApiHelperPanel';
import {
  FileCheck,
  Layers,
  FileCheck2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface FileToolsViewProps {
  onOpenRules: () => void;
}

export const FileToolsView: React.FC<FileToolsViewProps> = ({ onOpenRules }) => {
  const [mode, setMode] = useState<CheckMode>('template_header');
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFixTab, setActiveFixTab] = useState<string | undefined>(undefined);

  const runValidation = async (files: File[], targetMode: CheckMode) => {
    setIsProcessing(true);
    try {
      const newMap = new Map(fileMap);
      const newResults: ValidationResult[] = [];

      for (const file of files) {
        const res = await validateMediaFile(file, targetMode);
        newMap.set(res.id, file);
        newResults.push(res);
      }

      setFileMap(newMap);
      setResults(newResults);
      if (newResults.length > 0) {
        setSelectedId(newResults[0].id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFilesSelected = (selectedFiles: File[]) => {
    runValidation(selectedFiles, mode);
  };

  const handleModeChange = async (newMode: CheckMode) => {
    setMode(newMode);
    if (results.length > 0 && selectedId) {
      const currentFiles = Array.from(fileMap.values());
      runValidation(currentFiles, newMode);
    }
  };

  const handleSelectFix = (fix: string) => {
    if (fix === 'compress_image') setActiveFixTab('image');
    else if (fix === 'make_sticker') setActiveFixTab('sticker');
    else if (fix === 'convert_audio_mp3') setActiveFixTab('audio');
    else if (fix === 'transcode_video_ffmpeg' || fix === 'fix_faststart') setActiveFixTab('video');
    else setActiveFixTab('image');

    document.getElementById('converter-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const activeResult = results.find((r) => r.id === selectedId) || results[0];
  const activeFile = activeResult ? fileMap.get(activeResult.id) : undefined;

  const handleClear = () => {
    setFileMap(new Map());
    setResults([]);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Body Mode Selector Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              媒体校验模式选择
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
            {mode === 'template_header' ? '模板 Header 媒体检测模式' : '标准媒体消息检测模式'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {mode === 'template_header'
              ? '针对 WhatsApp 消息模板 Header 样本上传的严苛规则（Resumable Upload 仅限 JPG/PNG/MP4/PDF）'
              : '针对 WhatsApp 普通消息发送的官方标准媒体格式规则'}
          </p>
        </div>

        {/* Mode Switch Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            onClick={() => handleModeChange('standard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              mode === 'standard'
                ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>标准媒体模式</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
              /media
            </span>
          </button>

          <button
            onClick={() => handleModeChange('template_header')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              mode === 'template_header'
                ? 'bg-white text-teal-800 shadow-xs font-semibold ring-1 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-teal-600" />
            <span>模板 Header 模式</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100/70 text-teal-800 font-bold">
              /uploads 特殊校验
            </span>
          </button>
        </div>
      </div>

      {/* Mode Sub-banner notice moved to page body */}
      <div
        className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-colors border ${
          mode === 'template_header'
            ? 'bg-teal-50 text-teal-900 border-teal-200'
            : 'bg-emerald-50/70 text-emerald-900 border-emerald-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0" />
            <span>
              {mode === 'template_header' ? (
                <>
                  <strong>当前模式规则要点：</strong>
                  仅支持 <code className="bg-teal-100 px-1 py-0.2 rounded">JPG/PNG (≤5MB)</code>、
                  <code className="bg-teal-100 px-1 py-0.2 rounded">MP4 视频 (≤16MB)</code>、
                  <code className="bg-teal-100 px-1 py-0.2 rounded">PDF 文档 (≤100MB)</code>。
                  <span className="text-red-700 font-semibold ml-1">
                    严禁音频、贴纸、3GP 视频及 Word/Excel/PPT 文档！
                  </span>
                </>
              ) : (
                <>
                  <strong>当前模式规则要点：</strong>
                  支持图片 (≤5MB)、MP4/3GP 视频 (≤16MB)、音频 (≤16MB)、PDF/Office/TXT 文档 (≤100MB)、贴纸 (512x512 WebP)。
                </>
              )}
            </span>
          </div>

          {results.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center space-x-1 px-2.5 py-1 text-[11px] text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-lg transition-colors border border-rose-200 shadow-2xs"
            >
              <Trash2 className="w-3 h-3" />
              <span>清空重选</span>
            </button>
          )}
        </div>
      </div>

      {/* DropZone Section */}
      <DropZone
        mode={mode}
        onFilesSelected={handleFilesSelected}
        isProcessing={isProcessing}
      />

      {/* Multi-file Tab Bar if multiple files loaded */}
      {results.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-500 flex-shrink-0">
            文件列表 ({results.length})：
          </span>
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex-shrink-0 ${
                r.id === activeResult?.id
                  ? 'bg-white border-emerald-500 text-slate-900 shadow-xs ring-1 ring-emerald-500/20'
                  : 'bg-slate-100/70 border-slate-200 text-slate-600 hover:bg-white'
              }`}
            >
              {r.overallStatus === 'pass' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              )}
              {r.overallStatus === 'warning' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              )}
              {r.overallStatus === 'error' && (
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className="truncate max-w-[140px]">{r.fileName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Results & Conversion Workspace */}
      {activeResult && activeFile && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 1. Master Inspection Result Card */}
          <InspectionResult
            result={activeResult}
            onSelectFix={handleSelectFix}
          />

          {/* 2. Client-Side Converter & Repair Panel */}
          <div id="converter-section">
            <ConverterPanel
              activeResult={activeResult}
              file={activeFile}
              initialTab={activeFixTab}
            />
          </div>

          {/* 3. API Generator Panel */}
          <div>
            <ApiHelperPanel activeResult={activeResult} />
          </div>
        </div>
      )}

      {/* Empty state guidance when no file uploaded */}
      {!activeResult && (
        <div className="border border-slate-200/80 rounded-2xl p-10 bg-white text-center shadow-2xs">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              等待媒体文件载入
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              请在上方拖入需要通过 WhatsApp Business API 发送的图片、视频、音频或文档，工具将实时分析二进制头签名、分辨率、编码格式与文件大小，并提供针对性的合规修复。
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenRules}
                className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
              >
                <span>查看 Meta WhatsApp 官方规格对照表</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
