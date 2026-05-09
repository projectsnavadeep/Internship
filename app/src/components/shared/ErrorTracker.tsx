import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '@/lib/supabase';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** If true, renders inline fallback instead of full-screen overlay */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// fix: ErrorTracker now renders an inline fallback when used inside content area, full-screen only at root
export class ErrorTracker extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorTracker] Caught error:', error.message);

    // fix: save recovery_context so App.tsx can restore the user's tab after reload
    const isChunkError = error.message && (
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Failed to load module after') ||
      error.message.includes('Lazy element type must resolve to a class or function') ||
      error.message.includes('Element type is invalid') ||
      error.message.includes('error loading dynamically imported module')
    );

    if (isChunkError) {
      try {
        const currentTab = localStorage.getItem('activeTab') || 'dashboard';
        if (!sessionStorage.getItem('recovery_context')) {
          sessionStorage.setItem('recovery_context', JSON.stringify({
            tab: currentTab,
            timestamp: new Date().toISOString(),
            error: error.message
          }));
        }
      } catch (_) {
        // sessionStorage may be full or unavailable
      }

      // fix: only reload ONCE per session for chunk errors — prevents infinite loop
      const hasReloadedForChunks = sessionStorage.getItem('chunk_reload_done');
      if (!hasReloadedForChunks) {
        sessionStorage.setItem('chunk_reload_done', 'true');
        sessionStorage.setItem('last_chunk_reload_time', Date.now().toString());
        window.location.reload();
        return;
      }
      // If already reloaded once and still failing, fall through to show error UI
    }

    // fix: always log the error to Supabase for admin visibility
    logError({
      errorType: 'rendering',
      errorMessage: `UI ERROR: ${error.message}`,
      errorStack: `${error.stack}\n\nCOMPONENT STACK:\n${errorInfo.componentStack}`,
      source: 'frontend',
      actionAttempted: 'component_render',
      endpointOrFile: window.location.hash || window.location.pathname,
      role: 'system'
    });
  }

  // fix: retry clears recovery state and reloads cleanly
  private handleRetry = () => {
    sessionStorage.removeItem('recovery_context');
    sessionStorage.removeItem('chunk_load_error_reloaded');
    sessionStorage.removeItem('chunk_reload_done');
    sessionStorage.removeItem('last_chunk_reload_time');
    this.setState({ hasError: false, error: null });
  };


  private handleGoHome = () => {
    sessionStorage.removeItem('recovery_context');
    localStorage.setItem('activeTab', 'dashboard');
    window.location.hash = 'dashboard';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // fix: inline mode renders a compact error card instead of full-screen takeover
      return (
        <div className={`flex items-center justify-center ${this.props.inline ? 'py-20' : 'min-h-[400px]'} p-6`}>
          <div className="max-w-md w-full p-8 rounded-[32px] bg-white dark:bg-zinc-900 border border-red-500/10 text-center space-y-5 shadow-xl">
            <div className="w-16 h-16 rounded-[20px] bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={32} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
                Something went wrong.
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm leading-relaxed">
                This section encountered an error. Your data is safe.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 text-left overflow-auto max-h-24">
              <p className="text-[10px] font-mono text-red-500/70 uppercase font-bold tracking-widest">Error</p>
              <p className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 mt-1 break-all">
                {this.state.error?.message}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 rounded-2xl bg-apple-blue text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-apple-blue/20"
              >
                <RefreshCw size={16} />
                Retry
              </button>
              <button
                onClick={this.handleGoHome}
                className="py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
