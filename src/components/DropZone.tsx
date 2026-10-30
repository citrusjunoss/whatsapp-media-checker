import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  AlertCircle,
  Globe,
  Loader2,
  FileCheck,
  CheckCircle,
} from 'lucide-react';
import { CheckMode } from '../core/rules';
import { fetchRemoteFile } from '../core/remoteFetcher';

interface DropZoneProps {
  mode: CheckMode;
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ mode, onFilesSelected, isProcessing }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'remote'>('local');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Remote URL state
  const [remoteUrl, setRemoteUrl] = useState('');
  const [isFetchingRemote, setIsFetchingRemote] = useState(false);
  const [remoteStatusMsg, setRemoteStatusMsg] = useState('');
  const [remoteError, setRemoteError] = useState('');
  const [useCorsProxy, setUseCorsProxy] = useState(true);

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
      e.target.value = '';
    }
  };

  // Remote URL Fetch Handler
  const handleFetchRemote = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || remoteUrl).trim();
    if (!urlToFetch) {
      setRemoteError('请输入远程文件地址');
      return;
    }

    setRemoteError('');
    setIsFetchingRemote(true);
    setRemoteStatusMsg('正在连接远程服务器...');

    try {
      const file = await fetchRemoteFile(urlToFetch, {
        corsProxy: useCorsProxy,
        onProgressMessage: (msg) => setRemoteStatusMsg(msg),
      });
      setRemoteStatusMsg('拉取完成，正在检测规格...');
      onFilesSelected([file]);
      setRemoteUrl('');
    } catch (err: any) {
      setRemoteError(err.message || '远程文件获取失败');
    } finally {
      setIsFetchingRemote(false);
      setRemoteStatusMsg('');
    }
  };

  // Quick remote sample URLs
  const loadRemotePreset = (type: 'pdf' | 'mp4' | 'jpg' | 'webp') => {
    const presets: Record<string, string> = {
      pdf: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/test/pdfs/tracemonkey.pdf',
      mp4: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      jpg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
      webp: 'https://www.gstatic.com/webp/gallery/1.webp',
    };
    const target = presets[type];
    setRemoteUrl(target);
    handleFetchRemote(target);
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
    <div className="w-full space-y-3">
      {/* Upload Mode Switcher Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl space-x-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'local'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>本地文件上传</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remote')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'remote'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-teal-500/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-teal-600" />
            <span>输入远程文件链接 (URL)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 font-bold">
              HTTP/HTTPS
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          {activeTab === 'local' ? '支持拖拽本地多个文件' : '支持直接输入公开文件直链 (S3/OSS/CDN)'}
        </div>
      </div>

      {/* Tab 1: Local Drag & Drop Area */}
      {activeTab === 'local' && (
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
      )}

      {/* Tab 2: Remote URL Input Area */}
      {activeTab === 'remote' && (
        <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  输入远程文件地址 (URL)
                </h3>
                <p className="text-xs text-slate-500">
                  支持输入公开的 HTTP/HTTPS 直链（如阿里云 OSS、腾讯云 COS、AWS S3、CDN 或公共测试地址）
                </p>
              </div>
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useCorsProxy}
                onChange={(e) => setUseCorsProxy(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span title="自动突破第三方 CDN 跨域 CORS 访问限制">自动 CORS 跨域代理</span>
            </label>
          </div>

          {/* URL Input Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchRemote();
                }}
                placeholder="粘贴远程文件直链，例如: https://example.com/invoice.pdf 或 sample.mp4..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              onClick={() => handleFetchRemote()}
              disabled={isFetchingRemote || !remoteUrl.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs disabled:opacity-50 transition-all shadow-xs flex-shrink-0"
            >
              {isFetchingRemote ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在拉取...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>拉取并检测</span>
                </>
              )}
            </button>
          </div>

          {/* Progress / Error message */}
          {remoteStatusMsg && (
            <div className="flex items-center space-x-2 text-xs text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-200">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{remoteStatusMsg}</span>
            </div>
          )}

          {remoteError && (
            <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{remoteError}</span>
            </div>
          )}

          {/* Quick preset testing URLs */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>一键测试公开远程示例：</span>
            </span>

            <button
              type="button"
              onClick={() => loadRemotePreset('pdf')}
              disabled={isFetchingRemote}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + 远程 PDF 样例文档
            </button>

            <button
              type="button"
              onClick={() => loadRemotePreset('jpg')}
              disabled={isFetchingRemote}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + 远程 JPG 样例图片
            </button>

            <button
              type="button"
              onClick={() => loadRemotePreset('mp4')}
              disabled={isFetchingRemote}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + 远程 MP4 样例文档
            </button>
          </div>
        </div>
      )}

      {/* Quick Test Local Samples */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500">
        <div className="flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>本地即时生成样例：</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => generateSample('valid_jpg')}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            + 合规 JPG
          </button>
          <button
            onClick={() => generateSample('dummy_sticker')}
            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            + 512×512 WebP 贴纸
          </button>
          {mode === 'template_header' && (
            <button
              onClick={() => generateSample('invalid_txt_header')}
              className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors border border-rose-200"
            >
              + 模板 Header 拦截样例 (.docx)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
