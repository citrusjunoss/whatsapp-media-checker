import { useState, useEffect, useCallback } from 'react';

export interface PWAState {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<boolean>;
  updateAvailable: boolean;
  updateApp: () => void;
}

// Track beforeinstallprompt globally
let deferredPrompt: any = null;

export function registerServiceWorker(onUpdateFound?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const swUrl = './sw.js';
      const registration = await navigator.serviceWorker.register(swUrl, { scope: './' });

      // Check if cross-origin isolation requires reload on first registration
      if (!window.crossOriginIsolated && registration.active && !navigator.serviceWorker.controller) {
        console.log('[PWA] Service worker activated for COOP/COEP, reloading once...');
        window.location.reload();
      }

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available.');
              onUpdateFound?.();
            }
          });
        }
      });
    } catch (err) {
      console.warn('[PWA] Service worker registration failed:', err);
    }
  });
}

export function usePWA(): PWAState {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check standalone mode
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();

    // Listen to beforeinstallprompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPrompt = null;
    });

    // Register SW
    registerServiceWorker(() => {
      setUpdateAvailable(true);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setIsInstallable(false);
    return outcome === 'accepted';
  }, []);

  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, []);

  return {
    isOnline,
    isInstallable,
    isInstalled,
    installApp,
    updateAvailable,
    updateApp,
  };
}
