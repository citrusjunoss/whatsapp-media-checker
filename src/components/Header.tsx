import React from 'react';
import { ShieldCheck, FileCheck, Search, FileCode2, ExternalLink, Sparkles } from 'lucide-react';

export type AppNav = 'file_tools' | 'error_lookup';

interface HeaderProps {
  activeNav: AppNav;
  onNavChange: (nav: AppNav) => void;
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeNav,
  onNavChange,
  onOpenRules,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  WhatsApp 开发者工具箱
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                  纯前端 v1.1
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                媒体格式检测转码 &amp; Cloud API 错误速查 · 100% 浏览器本地运算
              </p>
            </div>
          </div>

          {/* Primary Main Product Module Navigation */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => onNavChange('file_tools')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === 'file_tools'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>文件工具</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 hidden md:inline">
                媒体检测/转换
              </span>
            </button>

            <button
              onClick={() => onNavChange('error_lookup')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                activeNav === 'error_lookup'
                  ? 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-500/20'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-4 h-4 text-teal-600" />
              <span>错误速查</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                API Code
              </span>
            </button>
          </nav>

          {/* Action Links */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRules}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">官方规范速查</span>
            </button>

            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200/60"
            >
              <span>Meta 官方文档</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
