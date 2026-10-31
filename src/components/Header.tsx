import React from 'react';
import {
  ShieldCheck,
  FileCheck,
  Search,
  FileCode2,
  ExternalLink,
  Laptop,
  Sun,
  Terminal,
} from 'lucide-react';
import { useTheme, AppTheme } from '../core/themeContext';

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
  const { theme, setTheme } = useTheme();

  return (
    <header className="app-surface border-b app-border sticky top-0 z-30 transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-600 flex items-center justify-center text-white font-mono font-bold text-xs shadow-xs">
              WA
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold app-text-main tracking-tight font-mono">
                  WhatsApp DevTools
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded app-surface-subtle app-text-dim border app-border hidden sm:inline-block">
                  v1.2
                </span>
              </div>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center app-surface-subtle p-1 rounded-lg border app-border">
            <button
              onClick={() => onNavChange('file_tools')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeNav === 'file_tools'
                  ? 'app-surface app-text-main font-semibold shadow-xs border app-border'
                  : 'app-text-muted hover:app-text-main'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>文件工具</span>
            </button>

            <button
              onClick={() => onNavChange('error_lookup')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeNav === 'error_lookup'
                  ? 'app-surface app-text-main font-semibold shadow-xs border app-border'
                  : 'app-text-muted hover:app-text-main'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>错误速查</span>
            </button>
          </nav>

          {/* Right Tools: Theme Switcher & Links */}
          <div className="flex items-center space-x-2">
            {/* Theme Switcher Segment */}
            <div className="flex items-center app-surface-subtle p-0.5 rounded-md border app-border">
              <button
                type="button"
                onClick={() => setTheme('raycast')}
                className={`p-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                  theme === 'raycast'
                    ? 'app-surface app-text-main font-semibold border app-border'
                    : 'app-text-dim hover:app-text-muted'
                }`}
                title="Raycast / Linear 暗黑极客主题"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden xl:inline">Raycast</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('stripe')}
                className={`p-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                  theme === 'stripe'
                    ? 'app-surface app-text-main font-semibold border app-border'
                    : 'app-text-dim hover:app-text-muted'
                }`}
                title="Stripe 极简浅白主题"
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden xl:inline">Stripe</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('github')}
                className={`p-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                  theme === 'github'
                    ? 'app-surface app-text-main font-semibold border app-border'
                    : 'app-text-dim hover:app-text-muted'
                }`}
                title="GitHub 终端账本主题"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden xl:inline">GitHub</span>
              </button>
            </div>

            <button
              onClick={onOpenRules}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium app-surface-subtle app-text-muted hover:app-text-main rounded-md border app-border transition-colors"
            >
              <FileCode2 className="w-3 h-3" />
              <span className="hidden sm:inline">规范文档</span>
            </button>

            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-emerald-500 hover:text-emerald-400 app-surface-subtle rounded-md border app-border transition-colors"
            >
              <span>Meta API</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
