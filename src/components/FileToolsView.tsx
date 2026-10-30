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
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
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
    <div className="space-y-4">
      {/* Precision Mode Selector Toolbar */}
      <div className="app-surface rounded-lg border app-border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider app-text-dim">
              MODE:
            </span>
            <span className="text-sm font-bold app-text-main font-mono">
              {mode === 'template_header' ? '模板 Header 媒体检测 (/uploads)' : '标准媒体消息模式 (/media)'}
            </span>
          </div>
          <p className="text-xs app-text-muted mt-0.5">
            {mode === 'template_header'
              ? '对齐 Graph API Resumable Upload 严格规范（仅限 JPG/PNG/MP4/PDF，严禁音频/贴纸/3GP/Office）'
              : '对齐 Cloud API 标准媒体消息发送规范（支持图片、MP4/3GP 视频、音频、文档与 WebP 贴纸）'}
          </p>
        </div>

        {/* Mode Segment Switches */}
        <div className="flex items-center app-surface-subtle p-0.5 rounded-md border app-border self-start sm:self-auto">
          <button
            onClick={() => handleModeChange('standard')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
              mode === 'standard'
                ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                : 'app-text-muted hover:app-text-main'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>标准模式</span>
          </button>

          <button
            onClick={() => handleModeChange('template_header')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-mono transition-all ${
              mode === 'template_header'
                ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                : 'app-text-muted hover:app-text-main'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>模板 Header</span>
          </button>
        </div>
      </div>

      {/* Mode Spec Brief Strip */}
      <div className="px-3.5 py-2 rounded-md border app-border app-surface-subtle text-xs flex items-center justify-between transition-colors">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="app-text-muted font-mono text-[11px]">
            {mode === 'template_header' ? (
              <>
                <strong className="app-text-main">WHITELIST: </strong>
                <span>JPG/PNG ≤ 5MB · MP4 ≤ 16MB · PDF ≤ 100MB</span>
                <span className="text-rose-500 font-semibold ml-2">
                  [BLOCKED: Audio, Sticker, 3GP, Office/Word/Excel]
                </span>
              </>
            ) : (
              <>
                <strong className="app-text-main">WHITELIST: </strong>
                <span>Image ≤ 5MB · Video ≤ 16MB (H.264+AAC) · Audio ≤ 16MB · Doc ≤ 100MB · Sticker (512x512 WebP)</span>
              </>
            )}
          </span>
        </div>

        {results.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-1 px-2 py-0.5 text-[11px] font-mono text-rose-500 hover:text-rose-400 app-surface rounded border app-border transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        )}
      </div>

      {/* DropZone Section */}
      <DropZone
        mode={mode}
        onFilesSelected={handleFilesSelected}
        isProcessing={isProcessing}
      />

      {/* Multi-file Tab Bar */}
      {results.length > 1 && (
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-mono">
          <span className="app-text-dim flex-shrink-0 text-[11px]">FILES ({results.length}):</span>
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs border transition-all flex-shrink-0 ${
                r.id === activeResult?.id
                  ? 'app-surface app-text-main border-emerald-500/70 font-semibold'
                  : 'app-surface-subtle app-text-muted hover:app-text-main app-border'
              }`}
            >
              {r.overallStatus === 'pass' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {r.overallStatus === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
              {r.overallStatus === 'error' && <XCircle className="w-3 h-3 text-rose-500" />}
              <span className="truncate max-w-[140px]">{r.fileName}</span>
            </button>
          ))}
        </div>
      )}

      {/* Inspection Results & Actions */}
      {activeResult && activeFile && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <InspectionResult
            result={activeResult}
            onSelectFix={handleSelectFix}
          />

          <div id="converter-section">
            <ConverterPanel
              activeResult={activeResult}
              file={activeFile}
              initialTab={activeFixTab}
            />
          </div>

          <div>
            <ApiHelperPanel activeResult={activeResult} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!activeResult && (
        <div className="app-surface rounded-lg border app-border p-8 text-center space-y-2">
          <div className="font-mono text-sm app-text-muted">AWAITING_MEDIA_PAYLOAD</div>
          <p className="text-xs app-text-dim max-w-md mx-auto">
            拖拽或粘贴待发送的 WhatsApp 媒体资产（图片、视频、音频、PDF、贴纸），系统将在浏览器内存中完成二进制头特征嗅探、规格校验与转码修复。
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenRules}
              className="px-3 py-1 rounded border app-border text-xs font-mono app-text-muted hover:app-text-main app-surface-subtle"
            >
              VIEW_META_SPECIFICATIONS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
