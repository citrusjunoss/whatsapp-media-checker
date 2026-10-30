import React from 'react';
import { CheckMode } from '../core/rules';
import { ExternalLink, ShieldCheck, FileCheck, Layers, FileCode2 } from 'lucide-react';

interface HeaderProps {
  mode: CheckMode;
  onModeChange: (mode: CheckMode) => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({ mode, onModeChange, onOpenRules }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  WhatsApp 媒体检测与转换工具
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  纯前端 v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                对齐 Meta Cloud API 与 Graph API 官方规范 · 浏览器本地执行
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onModeChange('standard')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'standard'
                  ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>标准媒体模式</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                /media
              </span>
            </button>

            <button
              onClick={() => onModeChange('template_header')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === 'template_header'
                  ? 'bg-white text-teal-800 shadow-sm font-semibold ring-1 ring-teal-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>模板 Header 模式</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100/70 text-teal-800 font-bold">
                /uploads 特殊校验
              </span>
            </button>
          </div>

          {/* Links & Rules */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRules}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              <span>官方规范速查</span>
            </button>
            <a
              href="https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200/60"
            >
              <span>Meta 官方文档</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Mode Sub-banner notice */}
      <div
        className={`px-4 py-1.5 text-xs font-medium transition-colors border-t ${
          mode === 'template_header'
            ? 'bg-teal-50 text-teal-900 border-teal-200'
            : 'bg-emerald-50/60 text-emerald-900 border-emerald-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>
              {mode === 'template_header' ? (
                <>
                  <strong>当前模式：模板 Header 媒体检测（Resumable Upload API）</strong> — 
                  仅支持 <code className="bg-teal-100 px-1 py-0.2 rounded">JPG/PNG (≤5MB)</code>、
                  <code className="bg-teal-100 px-1 py-0.2 rounded">MP4 视频 (≤16MB)</code>、
                  <code className="bg-teal-100 px-1 py-0.2 rounded">PDF 文档 (≤100MB)</code>。
                  <span className="text-red-700 font-semibold ml-1">
                    严禁音频、贴纸、3GP 视频及 Word/Excel/PPT 文档！
                  </span>
                </>
              ) : (
                <>
                  <strong>当前模式：标准媒体模式（Cloud API /media）</strong> — 
                  支持图片 (≤5MB)、MP4/3GP 视频 (≤16MB)、音频 (≤16MB)、PDF/Office/TXT 文档 (≤100MB)、贴纸 (512x512 WebP)。
                </>
              )}
            </span>
          </div>
          <span className="text-[11px] opacity-75 hidden sm:inline">
            数据均在本地浏览器处理，无任何数据上传至第三方服务器
          </span>
        </div>
      </div>
    </header>
  );
};
