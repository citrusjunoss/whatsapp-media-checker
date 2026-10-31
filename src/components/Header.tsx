import React from 'react';
import { ExternalLink } from 'lucide-react';

export type AppNav = 'file_tools' | 'error_lookup';

export const Header: React.FC = () => {
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

          {/* Right Tools: Meta API link */}
          <div className="flex items-center space-x-2">
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
