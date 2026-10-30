import React, { useState, useEffect } from 'react';
import { Header, AppNav } from './components/Header';
import { FileToolsView } from './components/FileToolsView';
import { ErrorLookup } from './components/ErrorLookup';
import { RulesReference } from './components/RulesReference';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [activeNav, setActiveNav] = useState<AppNav>(() => {
    // Read from window.location.hash
    if (typeof window !== 'undefined' && window.location.hash.includes('errors')) {
      return 'error_lookup';
    }
    return 'file_tools';
  });

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Sync hash on navigation change
  const handleNavChange = (nav: AppNav) => {
    setActiveNav(nav);
    if (typeof window !== 'undefined') {
      window.location.hash = nav === 'error_lookup' ? '#/errors' : '#/media';
    }
  };

  // Listen for browser back/forward hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('errors')) {
        setActiveNav('error_lookup');
      } else {
        setActiveNav('file_tools');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeNav === 'file_tools' ? (
          <FileToolsView onOpenRules={() => setIsRulesOpen(true)} />
        ) : (
          <ErrorLookup />
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
            <span>WhatsApp 开发者综合工具箱 · 纯前端架构 · 支持直接部署至 GitHub Pages</span>
          </div>
          <div>
            基于 Meta Graph API &amp; WhatsApp Cloud API 官方规范构建
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
