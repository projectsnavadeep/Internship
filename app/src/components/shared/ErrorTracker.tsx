import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '@/lib/supabase';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorTracker extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    logError({
      errorType: 'rendering',
      errorMessage: error.message || 'Rendering error',
      errorStack: error.stack || JSON.stringify(errorInfo),
      source: 'frontend',
      actionAttempted: 'component_render',
      endpointOrFile: window.location.pathname,
      role: 'system' // Fallback role
    });
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-apple-gray dark:bg-apple-near-black p-6">
          <div className="apple-card max-w-md w-full p-10 bg-white dark:bg-zinc-900 border border-red-500/10 text-center space-y-6">
            <div className="w-20 h-20 rounded-[28px] bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={40} />
            </div>
            
            <div>
              <h1 className="text-2xl font-black text-apple-near-black dark:text-white tracking-tight">Something went wrong.</h1>
              <p className="text-apple-near-black/60 dark:text-white/60 mt-2 text-sm leading-relaxed">
                A technical error occurred while rendering the page. We've logged this for the administrators to investigate.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 text-left overflow-auto max-h-32">
              <p className="text-[10px] font-mono text-red-500/70 uppercase font-bold tracking-widest">Error Trace</p>
              <p className="text-[11px] font-mono dark:text-white/50 mt-1">{this.state.error?.message}</p>
            </div>

            <button
              onClick={this.handleReset}
              className="w-full py-4 rounded-2xl bg-apple-blue text-white font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-apple-blue/20"
            >
              <RefreshCw size={18} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
