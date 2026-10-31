import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const swUrl = 'https://example.com/whatsapp-media-checker/sw.js';

function createBrowser(storage = new Map<string, string>()) {
  const registration = Object.assign(new EventTarget(), {
    active: { scriptURL: swUrl },
    installing: null as (EventTarget & { state: string }) | null,
  });
  const serviceWorker = Object.assign(new EventTarget(), {
    controller: null as { scriptURL: string } | null,
    register: vi.fn().mockResolvedValue(registration),
  });
  const window = Object.assign(new EventTarget(), {
    crossOriginIsolated: false,
    location: { href: 'https://example.com/whatsapp-media-checker/#/errors', reload: vi.fn() },
    sessionStorage: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { storage.set(key, value); }),
    },
  });
  const document = { readyState: 'complete' };
  vi.stubGlobal('window', window);
  vi.stubGlobal('navigator', { serviceWorker });
  vi.stubGlobal('document', document);
  return { window, serviceWorker, registration, document, storage };
}

describe('Service Worker bootstrap', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('waits for control, then reloads only once despite repeated events', async () => {
    const { window, serviceWorker } = createBrowser();
    const { registerServiceWorker } = await import('../usePWA');
    registerServiceWorker();
    await Promise.resolve();
    expect(window.location.reload).not.toHaveBeenCalled();

    serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(window.location.reload).not.toHaveBeenCalled();
    serviceWorker.controller = { scriptURL: swUrl };
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload again after navigation when isolation remains unavailable', async () => {
    const first = createBrowser();
    first.serviceWorker.controller = { scriptURL: swUrl };
    (await import('../usePWA')).registerServiceWorker();
    await Promise.resolve();
    expect(first.window.location.reload).toHaveBeenCalledTimes(1);

    vi.resetModules();
    const next = createBrowser(first.storage);
    next.serviceWorker.controller = { scriptURL: swUrl };
    (await import('../usePWA')).registerServiceWorker();
    await Promise.resolve();
    next.serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(next.window.location.reload).not.toHaveBeenCalled();
  });

  it('registers once across StrictMode remounts and removes stale update subscribers', async () => {
    const { window, document, serviceWorker, registration } = createBrowser();
    document.readyState = 'loading';
    window.crossOriginIsolated = true;
    const { registerServiceWorker } = await import('../usePWA');
    const stale = vi.fn();
    const current = vi.fn();
    registerServiceWorker(stale)?.();
    registerServiceWorker(current);
    expect(serviceWorker.register).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    window.dispatchEvent(new Event('load'));
    await Promise.resolve();
    expect(serviceWorker.register).toHaveBeenCalledExactlyOnceWith(swUrl, { scope: './' });

    serviceWorker.controller = { scriptURL: swUrl };
    registration.installing = Object.assign(new EventTarget(), { state: 'installing' });
    registration.dispatchEvent(new Event('updatefound'));
    registration.installing.state = 'installed';
    registration.installing.dispatchEvent(new Event('statechange'));
    expect(stale).not.toHaveBeenCalled();
    expect(current).toHaveBeenCalledTimes(1);
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('registers even when the page load event has already fired', async () => {
    const { serviceWorker } = createBrowser();
    (await import('../usePWA')).registerServiceWorker();
    expect(serviceWorker.register).toHaveBeenCalledExactlyOnceWith(swUrl, { scope: './' });
  });

  it.each(['getItem', 'setItem'] as const)('does not reload if sessionStorage.%s is blocked', async (method) => {
    const { window, serviceWorker } = createBrowser();
    window.sessionStorage[method].mockImplementation(() => { throw new Error('Storage blocked'); });
    serviceWorker.controller = { scriptURL: swUrl };
    (await import('../usePWA')).registerServiceWorker();
    await Promise.resolve();
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('does not reload for another worker controlling the same origin', async () => {
    const { window, serviceWorker } = createBrowser();
    serviceWorker.controller = { scriptURL: 'https://example.com/sw.js' };
    (await import('../usePWA')).registerServiceWorker();
    await Promise.resolve();
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(window.location.reload).not.toHaveBeenCalled();
  });

  it('leaves the page usable when registration fails', async () => {
    const { window, serviceWorker } = createBrowser();
    serviceWorker.register.mockRejectedValue(new Error('Registration blocked'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    (await import('../usePWA')).registerServiceWorker();
    await Promise.resolve();
    serviceWorker.controller = { scriptURL: swUrl };
    serviceWorker.dispatchEvent(new Event('controllerchange'));
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
