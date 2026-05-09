import { lazy, type ComponentType } from 'react';

/**
 * Module Recovery Handler
 * Retries failed dynamic imports up to 3 times with 800ms delay,
 * then saves recovery context and throws a clear error for ErrorTracker.
 */

interface SafeLazyOptions {
  maxRetries?: number;
  delay?: number;
}

// fix: increased retries to 3, reduced delay to 800ms, improved error message clarity
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

        // fix: guard against modules that resolve but have no default export
        if (!module || typeof module.default !== 'function') {
          throw new Error(
            `Module loaded but has no valid default export. Check that the target file uses "export default".`
          );
        }

        return module;
      } catch (error: any) {
        lastError = error;
        const isChunkError =
          error.message?.includes('Failed to fetch dynamically imported module') ||
          error.message?.includes('Unable to preload CSS') ||
          error.message?.includes('error loading dynamically imported module') ||
          error.message?.includes('Importing a module script failed');

        if (isChunkError && attempt < maxRetries) {
          // fix: wait then retry — do not throw yet
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Final failure — save recovery context so ErrorTracker/App can restore tab
        // fix: always save recovery_context on final chunk failure
        if (isChunkError) {
          try {
            const currentTab = localStorage.getItem('activeTab') || 'dashboard';
            sessionStorage.setItem('recovery_context', JSON.stringify({
              tab: currentTab,
              timestamp: new Date().toISOString(),
              error: error.message
            }));
          } catch (_) {
            // sessionStorage may be unavailable — ignore
          }
        }

        // fix: throw a clear, human-readable error that ErrorTracker can display
        throw new Error(
          `Failed to load module after ${attempt + 1} attempt(s): ${error.message || 'Unknown import error'}`
        );
      }
    }

    // Unreachable, but satisfies TS return type
    throw lastError || new Error('Module load failed');
  });
}
