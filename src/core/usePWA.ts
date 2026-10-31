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
let registrationStarted = false;
const updateListeners = new Set<() => void>();

export function registerServiceWorker(onUpdateFound?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (onUpdateFound) updateListeners.add(onUpdateFound);
  const unsubscribe = () => {
    if (onUpdateFound) updateListeners.delete(onUpdateFound);
  };
  // React StrictMode and remounts must share one registration/bootstrap.
  if (registrationStarted) return unsubscribe;
  registrationStarted = true;

  const register = async () => {
    const serviceWorker = navigator.serviceWorker;
    const swUrl = new URL('./sw.js', window.location.href).href;
    const reloadKey = `wa-devtools:coi-reload:${swUrl}`;
    let reloadRequested = false;
    const reloadForIsolation = () => {
      // An active registration does not mean it controls this document yet.
      if (window.crossOriginIsolated || reloadRequested || serviceWorker.controller?.scriptURL !== swUrl) {
        return;
      }
      try {
        if (window.sessionStorage.getItem(reloadKey)) return;
        // Persist before navigating: even if isolation fails, never loop.
        window.sessionStorage.setItem(reloadKey, '1');
      } catch {
        // Without persistent loop protection, leave the page usable as-is.
        return;
      }
      reloadRequested = true;
      window.location.reload();
    };

    serviceWorker.addEventListener('controllerchange', reloadForIsolation);
    try {
      const registration = await serviceWorker.register(swUrl, { scope: './' });
      reloadForIsolation();

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available.');
              updateListeners.forEach((listener) => listener());
            }
          });
        }
      });
    } catch (err) {
      serviceWorker.removeEventListener('controllerchange', reloadForIsolation);
      console.warn('[PWA] Service worker registration failed:', err);
    }
  };

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
  return unsubscribe;
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
    const unsubscribeUpdates = registerServiceWorker(() => {
      setUpdateAvailable(true);
    });

    return () => {
      unsubscribeUpdates?.();
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
