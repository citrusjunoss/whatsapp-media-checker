import React from 'react';
import { ExternalLink, Download, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '../core/usePWA';

export type AppNav = 'file_tools' | 'error_lookup';

export const Header: React.FC = () => {
  const { isOnline, isInstallable, installApp, updateAvailable, updateApp } = usePWA();

  return (
    <header className="app-surface border-b app-border sticky top-0 z-30 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
              WA
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold app-text-main tracking-tight font-mono">
                WhatsApp DevTools
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded app-surface-subtle app-text-dim border app-border hidden sm:inline-block">
                v1.2
              </span>
            </div>
          </div>

          {/* Right Tools: PWA Status & Meta API link */}
          <div className="flex items-center space-x-2">
            {/* Offline indicator */}
            {!isOnline && (
              <span
                className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30"
                title="已离线运行，所有本地缓存资源可正常使用"
              >
                <WifiOff className="w-3 h-3" />
                <span className="hidden sm:inline">离线模式 (缓存就绪)</span>
              </span>
            )}

            {/* PWA Update Banner */}
            {updateAvailable && (
              <button
                type="button"
                onClick={updateApp}
                className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-blue-400 hover:text-white hover:bg-blue-600 app-surface-subtle rounded-md border border-blue-500/40 transition-colors font-mono animate-pulse"
                title="发现新版本，点击立即应用并刷新"
              >
                <RefreshCw className="w-3 h-3" />
                <span>更新应用</span>
              </button>
            )}

            {/* PWA Install Button */}
            {isInstallable && (
              <button
                type="button"
                onClick={installApp}
                className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:text-white hover:bg-emerald-600 app-surface-subtle rounded-md border border-emerald-500/40 transition-colors font-mono"
                title="将 WhatsApp DevTools 安装为桌面/移动端独立 App"
              >
                <Download className="w-3 h-3" />
                <span>安装 PWA</span>
              </button>
            )}

            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1 text-xs font-medium text-emerald-500 hover:text-emerald-400 app-surface-subtle rounded-md border app-border transition-colors font-mono"
            >
              <span>Meta API</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
