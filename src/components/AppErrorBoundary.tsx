import React, { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { hasError: boolean; error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- dev-only error boundary diagnostics
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex flex-col items-center justify-center p-8 bg-surface text-on-surface border-4 border-error"
        >
          <h1 className="text-2xl font-black uppercase tracking-widest mb-4">We couldn&apos;t load the app</h1>
          <p className="text-on-surface-variant font-bold text-sm max-w-md text-center mb-6">
            Refresh the page to continue. If this keeps happening, try again later or contact venue support.
          </p>
          <button
            type="button"
            className="px-6 py-3 bg-primary text-on-primary font-black uppercase tracking-widest border-2 border-black"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
