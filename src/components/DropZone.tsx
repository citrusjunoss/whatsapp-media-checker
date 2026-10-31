import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Globe,
  Loader2,
  FileCheck,
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

  const handleFetchRemote = async (targetUrl?: string) => {
    const urlToFetch = (targetUrl || remoteUrl).trim();
    if (!urlToFetch) {
      setRemoteError('请输入远程文件直链 URL');
      return;
    }

    setRemoteError('');
    setIsFetchingRemote(true);
    setRemoteStatusMsg('CONNECTING_REMOTE_SERVER...');

    try {
      const file = await fetchRemoteFile(urlToFetch, {
        corsProxy: useCorsProxy,
        onProgressMessage: (msg) => setRemoteStatusMsg(msg),
      });
      setRemoteStatusMsg('FETCH_COMPLETE');
      onFilesSelected([file]);
      setRemoteUrl('');
    } catch (err: any) {
      setRemoteError(err.message || '远程文件获取失败');
    } finally {
      setIsFetchingRemote(false);
      setRemoteStatusMsg('');
    }
  };

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

  const generateSample = (type: 'valid_jpg' | 'invalid_txt_header' | 'dummy_sticker') => {
    if (type === 'valid_jpg') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '32px monospace';
      ctx.fillText('WhatsApp Valid Sample JPG', 180, 300);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'sample_valid_header.jpg', { type: 'image/jpeg' });
          onFilesSelected([file]);
        }
      }, 'image/jpeg', 0.9);
    } else if (type === 'invalid_txt_header') {
      const blob = new Blob(['Sample text pretending to be document'], { type: 'text/plain' });
      const file = new File([blob], 'quarterly_report.docx', { type: 'text/plain' });
      onFilesSelected([file]);
    } else if (type === 'dummy_sticker') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(256, 256, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '48px monospace';
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
    <div className="w-full space-y-2.5">
      {/* Upload Segment Selector */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center app-surface-subtle p-0.5 rounded-md border app-border space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-mono transition-all ${
              activeTab === 'local'
                ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                : 'app-text-muted hover:app-text-main'
            }`}
          >
            <Upload className="w-3 h-3 text-emerald-500" />
            <span>LOCAL_DROP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('remote')}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-mono transition-all ${
              activeTab === 'remote'
                ? 'app-surface app-text-main font-semibold border app-border shadow-xs'
                : 'app-text-muted hover:app-text-main'
            }`}
          >
            <Globe className="w-3 h-3 text-teal-500" />
            <span>REMOTE_URL</span>
          </button>
        </div>

        <div className="text-[11px] font-mono app-text-dim hidden sm:block">
          {activeTab === 'local' ? 'MULTI_FILE_DRAG_SUPPORTED' : 'PUBLIC_HTTP_HTTPS_STREAM'}
        </div>
      </div>

      {/* Local Drag Drop Zone */}
      {activeTab === 'local' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 sm:p-5 transition-all cursor-pointer text-center ${
            isDragOver
              ? 'border-emerald-500 app-surface-subtle'
              : 'app-border app-surface hover:app-surface-subtle'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-md app-surface-subtle border app-border flex items-center justify-center text-emerald-500">
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="text-xs font-semibold font-mono app-text-main">
                点击选择文件，或直接拖拽文件到此处
              </div>
              <div className="text-[11px] font-mono app-text-dim mt-0.5">
                客户端二进制 Magic Bytes 校验 · 零服务器上传
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remote URL Input */}
      {activeTab === 'remote' && (
        <div className="app-surface rounded-lg border app-border p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-semibold app-text-main">
              输入公开媒体直链 (URL)
            </span>
            <label className="flex items-center space-x-1.5 font-mono text-[11px] app-text-dim cursor-pointer">
              <input
                type="checkbox"
                checked={useCorsProxy}
                onChange={(e) => setUseCorsProxy(e.target.checked)}
                className="rounded app-border text-emerald-600 focus:ring-0"
              />
              <span>CORS_PROXY_AUTO_FALLBACK</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <LinkIcon className="w-3.5 h-3.5 app-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFetchRemote();
                }}
                placeholder="https://example.com/asset.mp4 或 .pdf, .jpg..."
                className="w-full pl-8 pr-3 py-1.5 app-surface-subtle border app-border rounded-md text-xs font-mono app-text-main placeholder:app-text-dim focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleFetchRemote()}
              disabled={isFetchingRemote || !remoteUrl.trim()}
              className="w-full sm:w-auto px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center space-x-1.5"
            >
              {isFetchingRemote ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>FETCHING...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>PULL_AND_CHECK</span>
                </>
              )}
            </button>
          </div>

          {remoteStatusMsg && (
            <div className="text-[11px] font-mono text-emerald-500">
              &gt; {remoteStatusMsg}
            </div>
          )}

          {remoteError && (
            <div className="text-[11px] font-mono text-rose-500">
              ! ERROR: {remoteError}
            </div>
          )}

          {/* Quick Remote Presets */}
          <div className="pt-1.5 border-t app-border flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] font-mono app-text-dim">PRESETS:</span>
            <button
              type="button"
              onClick={() => loadRemotePreset('pdf')}
              disabled={isFetchingRemote}
              className="px-2 py-0.5 rounded text-[11px] font-mono app-surface-subtle app-text-muted hover:app-text-main border app-border"
            >
              PDF_REPORT
            </button>
            <button
              type="button"
              onClick={() => loadRemotePreset('jpg')}
              disabled={isFetchingRemote}
              className="px-2 py-0.5 rounded text-[11px] font-mono app-surface-subtle app-text-muted hover:app-text-main border app-border"
            >
              JPG_IMAGE
            </button>
            <button
              type="button"
              onClick={() => loadRemotePreset('mp4')}
              disabled={isFetchingRemote}
              className="px-2 py-0.5 rounded text-[11px] font-mono app-surface-subtle app-text-muted hover:app-text-main border app-border"
            >
              MP4_VIDEO
            </button>
          </div>
        </div>
      )}

      {/* Local Sample Generator */}
      <div className="flex items-center justify-between px-1 text-xs font-mono app-text-dim">
        <span>LOCAL_GENERATOR:</span>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => generateSample('valid_jpg')}
            className="px-2 py-0.5 rounded text-[11px] app-surface-subtle app-text-muted hover:app-text-main border app-border"
          >
            + VALID_JPG
          </button>
          <button
            onClick={() => generateSample('dummy_sticker')}
            className="px-2 py-0.5 rounded text-[11px] app-surface-subtle app-text-muted hover:app-text-main border app-border"
          >
            + 512x512_STICKER
          </button>
          {mode === 'template_header' && (
            <button
              onClick={() => generateSample('invalid_txt_header')}
              className="px-2 py-0.5 rounded text-[11px] app-surface-subtle text-rose-500 hover:text-rose-400 border app-border"
            >
              + INVALID_DOCX
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
