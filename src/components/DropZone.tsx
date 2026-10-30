import React, { useState, useRef } from 'react';
import { Upload, FilePlus, Sparkles, AlertCircle } from 'lucide-react';
import { CheckMode } from '../core/rules';

interface DropZoneProps {
  mode: CheckMode;
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ mode, onFilesSelected, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = ''; // reset so same file can be picked again
    }
  };

  // Preset sample generator for testing
  const generateSample = (type: 'valid_jpg' | 'invalid_txt_header' | 'dummy_sticker') => {
    if (type === 'valid_jpg') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#128C7E';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px sans-serif';
      ctx.fillText('WhatsApp Valid Sample Image', 180, 300);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_valid_header.jpg', { type: 'image/jpeg' });
          onFilesSelected([file]);
        }
      }, 'image/jpeg', 0.9);
    } else if (type === 'invalid_txt_header') {
      const blob = new Blob(['Sample document text that should be PDF in template header'], { type: 'text/plain' });
      const file = new File([blob], 'quarterly_report.docx', { type: 'text/plain' });
      onFilesSelected([file]);
    } else if (type === 'dummy_sticker') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#25D366';
      ctx.beginPath();
      ctx.arc(256, 256, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('512x512', 256, 270);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'whatsapp_sticker_test.webp', { type: 'image/webp' });
          onFilesSelected([file]);
        }
      }, 'image/webp', 0.8);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer text-center group ${
          isDragOver
            ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99] shadow-inner'
            : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              mode === 'template_header'
                ? 'bg-teal-100/80 text-teal-700'
                : 'bg-emerald-100/80 text-emerald-700'
            }`}
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">
              点击选择文件，或直接拖拽文件到此处
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              支持批量上传检测 · 毫秒级二进制真实格式嗅探 · 100% 浏览器本地运算
            </p>
          </div>

          {/* Mode-specific hints */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-600">
            {mode === 'template_header' ? (
              <>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  图片: JPG/PNG (≤5MB)
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  视频: 仅限 MP4 (≤16MB)
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  文档: 仅限 PDF (≤100MB)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  🚫 严禁音频与贴纸
                </span>
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  图片 ≤5MB (JPG/PNG)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  视频 ≤16MB (MP4/3GP)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  音频 ≤16MB (AAC/MP3/M4A/AMR/OGG)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  文档 ≤100MB (PDF/Office)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  贴纸 (512x512 WebP)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex items-center justify-between mt-2.5 px-2 text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>没有合适测试文件？点击快速生成样例测试：</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateSample('valid_jpg')}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            + 合规 JPG 样例
          </button>
          <button
            onClick={() => generateSample('dummy_sticker')}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            + 512×512 WebP 贴纸样例
          </button>
          {mode === 'template_header' && (
            <button
              onClick={() => generateSample('invalid_txt_header')}
              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
            >
              + 模板 Header 拦截触发样例 (.docx)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
