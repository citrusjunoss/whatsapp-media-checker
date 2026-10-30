import React, { useState, useEffect } from 'react';
import { CheckMode, ValidationResult } from './core/rules';
import { validateMediaFile } from './core/validator';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { InspectionResult } from './components/InspectionResult';
import { ConverterPanel } from './components/ConverterPanel';
import { ApiHelperPanel } from './components/ApiHelperPanel';
import { RulesReference } from './components/RulesReference';
import {
  FileCheck2,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export function App() {
  const [mode, setMode] = useState<CheckMode>('template_header'); // Default to template header or standard
  const [fileMap, setFileMap] = useState<Map<string, File>>(new Map());
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [activeFixTab, setActiveFixTab] = useState<string | undefined>(undefined);

  // Re-run validation whenever mode changes or new files added
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
    // If files already present, re-validate them under new mode!
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

    // Scroll to converter panel smoothly
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Drop & Upload Area */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                {mode === 'template_header' ? '模板 Header 媒体检测' : '标准媒体消息检测'}
              </h2>
              <p className="text-xs text-slate-500">
                {mode === 'template_header'
                  ? '针对 WhatsApp 消息模板 Header 上传的严苛规则（Resumable Upload 仅限 JPG/PNG/MP4/PDF）'
                  : '针对 WhatsApp 普通消息发送的官方标准媒体格式规则'}
              </p>
            </div>

            {results.length > 0 && (
              <button
                onClick={handleClear}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空重选</span>
              </button>
            )}
          </div>

          <DropZone
            mode={mode}
            onFilesSelected={handleFilesSelected}
            isProcessing={isProcessing}
          />
        </section>

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
          <div className="space-y-8 animate-in fade-in duration-200">
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
                  onClick={() => setIsRulesOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
                >
                  <span>查看 Meta WhatsApp 官方规格对照表</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rules Reference Drawer/Modal */}
      <RulesReference
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>纯前端 WhatsApp 媒体规范校验工具 · 支持一键部署至 GitHub Pages</span>
          </div>
          <div>
            基于 Meta Graph API & WhatsApp Cloud API 官方规范构建
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
