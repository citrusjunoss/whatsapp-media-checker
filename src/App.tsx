import React, { useState } from 'react';
import { RulesReference } from './components/RulesReference';
import { ThemeProvider, useTheme } from './core/themeContext';
import { RaycastView } from './components/themes/RaycastView';
import { StripeView } from './components/themes/StripeView';
import { GitHubView } from './components/themes/GitHubView';

function MainApp() {
  const { theme } = useTheme();
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  return (
    <div className="min-h-screen app-bg flex flex-col transition-colors p-2 sm:p-4 md:p-6">
      <main className="flex-1 max-w-[1440px] w-full mx-auto">
        {theme === 'stripe' ? (
          <StripeView onOpenRules={() => setIsRulesOpen(true)} />
        ) : theme === 'github' ? (
          <GitHubView onOpenRules={() => setIsRulesOpen(true)} />
        ) : (
          <RaycastView onOpenRules={() => setIsRulesOpen(true)} />
        )}
      </main>

      <RulesReference
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
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
