import React, { useState, useEffect } from 'react';
import { Header, AppNav } from './components/Header';
import { RulesReference } from './components/RulesReference';
import { ThemeProvider, useTheme } from './core/themeContext';
import { RaycastView } from './components/themes/RaycastView';
import { StripeView } from './components/themes/StripeView';
import { GitHubView } from './components/themes/GitHubView';

function MainContent({
  activeNav,
  onNavChange,
  onOpenRules,
}: {
  activeNav: AppNav;
  onNavChange: (nav: AppNav) => void;
  onOpenRules: () => void;
}) {
  const { theme } = useTheme();

  if (theme === 'stripe') {
    return (
      <StripeView
        activeNav={activeNav}
        onNavChange={onNavChange}
        onOpenRules={onOpenRules}
      />
    );
  }

  if (theme === 'github') {
    return (
      <GitHubView
        activeNav={activeNav}
        onNavChange={onNavChange}
        onOpenRules={onOpenRules}
      />
    );
  }

  return (
    <RaycastView
      activeNav={activeNav}
      onNavChange={onNavChange}
      onOpenRules={onOpenRules}
    />
  );
}

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
      {/* 1. Global Minimal Top Navbar */}
      <Header />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-6 py-4">
        <MainContent
          activeNav={activeNav}
          onNavChange={handleNavChange}
          onOpenRules={() => setIsRulesOpen(true)}
        />
      </main>

      {/* 3. Global Rules Modal */}
      <RulesReference
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* 4. Global Minimal Footer */}
      <footer className="border-t app-border py-3 app-surface-subtle text-xs font-mono app-text-dim text-center">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WhatsApp DevTools · Client-side Only · Zero Server Storage</span>
          <span className="text-[11px]">Meta Graph API v26.0 Compliance Engine</span>
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
