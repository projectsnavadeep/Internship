import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorTracker } from './components/shared/ErrorTracker'
import { logError } from './lib/supabase'

// Global non-React error handling
window.onerror = (message, source, lineno, colno, error) => {
  logError({
    errorType: 'unknown',
    errorMessage: typeof message === 'string' ? message : 'Global window error',
    errorStack: error?.stack || `At ${source}:${lineno}:${colno}`,
    source: 'frontend',
    actionAttempted: 'window_global_error',
    endpointOrFile: source || window.location.pathname,
    role: 'system'
  });
};

window.onunhandledrejection = (event) => {
  logError({
    errorType: 'network',
    errorMessage: event.reason?.message || 'Unhandled promise rejection',
    errorStack: event.reason?.stack,
    source: 'frontend',
    actionAttempted: 'promise_rejection',
    endpointOrFile: window.location.pathname,
    role: 'system'
  });
};

createRoot(document.getElementById('root')!).render(
  <ErrorTracker>
    <App />
  </ErrorTracker>
)
