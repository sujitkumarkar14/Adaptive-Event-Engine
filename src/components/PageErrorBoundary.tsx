import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = { children: ReactNode };

type State = { hasError: boolean };

/**
 * Route-scoped boundary so one failing lazy chunk or widget does not blank the whole app shell.
 */
export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- dev-only
      console.error('[PageErrorBoundary]', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="max-w-lg mx-auto my-12 p-6 border-4 border-error bg-error-container text-on-error-container"
        >
          <h2 className="text-xl font-black uppercase tracking-widest mb-2">This page couldn&apos;t load</h2>
          <p className="text-sm font-bold leading-relaxed mb-6 normal-case tracking-normal">
            Something went wrong while showing this screen. You can try again or continue to another area of the app.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="px-4 py-3 bg-on-error-container text-error-container font-black uppercase tracking-widest border-2 border-black"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-3 text-center font-black uppercase tracking-widest border-2 border-on-error-container"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
