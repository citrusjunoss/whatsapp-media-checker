import React, { useState, useEffect } from 'react';
import { Header, AppNav } from './components/Header';
import { FileToolsView } from './components/FileToolsView';
import { ErrorLookup } from './components/ErrorLookup';
import { RulesReference } from './components/RulesReference';
import { ThemeProvider } from './core/themeContext';

function MainApp() {
  const [activeNav, setActiveNav] = useState<AppNav>(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('errors')) {
      return 'error_lookup';
    }
    return 'file_tools';
  });

  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const handleNavChange = (nav: AppNav) => {
    setActiveNav(nav);
    if (typeof window !== 'undefined') {
      window.location.hash = nav === 'error_lookup' ? '#/errors' : '#/media';
    }
  };

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
    <div className="min-h-screen app-bg flex flex-col transition-colors">
      <Header
        activeNav={activeNav}
        onNavChange={handleNavChange}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeNav === 'file_tools' ? (
          <FileToolsView onOpenRules={() => setIsRulesOpen(true)} />
        ) : (
          <ErrorLookup />
        )}
      </main>

      <RulesReference
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <footer className="border-t app-border py-4 mt-8 app-surface-subtle text-xs font-mono app-text-dim transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            WhatsApp DevTools · Client-side Only · Zero Server Storage
          </div>
          <div className="flex items-center space-x-3">
            <span>Meta Graph API &amp; Cloud API v26.0</span>
            <span className="app-text-muted">MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;
