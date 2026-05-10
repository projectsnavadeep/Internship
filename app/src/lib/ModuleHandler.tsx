import { lazy, type ComponentType } from 'react';

/**
 * Elite Module Recovery Handler
 * 
 * Strategy:
 * 1. Retry up to 3 times with delay (handles flaky networks)
 * 2. On final chunk failure → auto-reload the page (handles stale Render deploys)
 * 3. Save recovery context so the app restores the correct tab after reload
 * 4. Only throw (show error screen) for NON-chunk errors (real code bugs)
 */

interface SafeLazyOptions {
  maxRetries?: number;
  delay?: number;
}

const RELOAD_FLAG = 'chunk_reload_attempted';

export function safeLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: SafeLazyOptions = {}
) {
  const { maxRetries = 3, delay = 800 } = options;

  return lazy(async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const module = await importFn();

        if (!module || typeof module.default !== 'function') {
          throw new Error(
            `Module loaded but has no valid default export. Check that the target file uses "export default".`
          );
        }

        // ✅ Success — clear the reload flag so future failures can reload again
        sessionStorage.removeItem(RELOAD_FLAG);
        return module;

      } catch (error: any) {
        lastError = error;

        const isChunkError =
          error.message?.includes('Failed to fetch dynamically imported module') ||
          error.message?.includes('Unable to preload CSS') ||
          error.message?.includes('error loading dynamically imported module') ||
          error.message?.includes('Importing a module script failed') ||
          error.message?.includes('Failed to load module');

        // Not a chunk error = real bug in code, show error screen immediately
        if (!isChunkError) {
          throw error;
        }

        // Still have retries left — wait and retry
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // ─── Final failure: it's a chunk error ───
        // This happens after Render redeploys — old chunk URLs no longer exist.
        // Solution: reload the page ONCE to get fresh chunk URLs.

        const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);

        if (!alreadyReloaded) {
          // Save which tab the user was on so App.tsx can restore it
          try {
            const currentTab = localStorage.getItem('activeTab') || 'dashboard';
            sessionStorage.setItem(RELOAD_FLAG, 'true');
            sessionStorage.setItem('recovery_context', JSON.stringify({
              tab: currentTab,
              timestamp: new Date().toISOString(),
              error: error.message
            }));
          } catch (_) {
            // sessionStorage unavailable — still reload
          }

          // Hard reload to get fresh JS chunks from Render
          window.location.reload();

          // Return a dummy component while reload happens (never actually renders)
          return { default: (() => null) as unknown as T };
        }

        // Already reloaded once and still failing — show error screen
        // This means it's a real deployment issue, not just stale cache
        throw new Error(
          `Failed to load module after ${attempt + 1} attempt(s) and a page reload: ${error.message || 'Unknown import error'}`
        );
      }
    }

    throw lastError || new Error('Module load failed');
  });
}