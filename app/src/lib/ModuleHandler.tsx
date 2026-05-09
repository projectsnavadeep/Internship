import { lazy, type ComponentType } from 'react';

/**
 * ELITE MODULE RECOVERY HANDLER
 * Designed by Senior SDL (Microsoft) for InternTrack
 * 
 * Intercepts "Failed to fetch" errors during lazy-loading and performs 
 * localized retries before triggering a global recovery.
 */

interface SafeLazyOptions {
  maxRetries?: number;
  delay?: number;
}

export function safeLazy<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: SafeLazyOptions = {}
) {
  const { maxRetries = 2, delay = 1000 } = options;

  return lazy(async () => {
    let retries = 0;
    
    while (retries <= maxRetries) {
      try {
        return await importFn();
      } catch (error: any) {
        const isChunkError = error.message?.includes('Failed to fetch dynamically imported module');
        
        if (isChunkError && retries < maxRetries) {
          retries++;
          console.warn(`[🚀 ModuleHandler] Load failed. Retrying (${retries}/${maxRetries})...`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If we reach here, it's a permanent failure or max retries reached
        if (isChunkError) {
          console.error('[🚀 ModuleHandler] Critical chunk failure. Triggering state-preserving recovery.');
          // Save context before the inevitable crash so the ErrorTracker can restore it
          const currentTab = localStorage.getItem('activeTab') || 'dashboard';
          sessionStorage.setItem('recovery_context', JSON.stringify({
            tab: currentTab,
            timestamp: new Date().toISOString(),
            error: error.message
          }));
        }
        
        throw error;
      }
    }
    
    return await importFn(); // Fallback
  });
}
