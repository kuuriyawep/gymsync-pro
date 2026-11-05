import React from 'react';
import { Sentry } from '@/lib/sentry';

const CHUNK_ERROR_PATTERNS = [
  'Importing a module script failed',
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
];

function isChunkLoadError(error) {
  if (!error || !error.message) return false;
  return CHUNK_ERROR_PATTERNS.some(pattern =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Catches render/runtime failures so one broken screen cannot leave the user on
 * a blank page. A stale code chunk reloads itself (the server already has the
 * new build); anything else shows a recovery screen with a safe way out.
 *
 * Rethrowing non-chunk errors — the previous behaviour — propagated them past
 * the boundary and took the whole app down with no recovery interface.
 */
class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { chunk: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) return { chunk: true, error: null };
    return { chunk: false, error };
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!prevState.chunk && this.state.chunk) {
      window.location.reload();
    }
  }

  componentDidCatch(error, info) {
    if (!isChunkLoadError(error)) {
      Sentry?.captureException?.(error, { extra: { componentStack: info?.componentStack } });
    }
  }

  reset() {
    this.setState({ chunk: false, error: null });
  }

  render() {
    if (this.state.chunk) return null;

    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="max-w-sm text-center">
            <h1 className="font-heading text-xl font-bold">This screen couldn't load</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while showing this page. Your data has not been changed.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={this.reset}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Try this screen again
              </button>
              <a
                href="/"
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Back to dashboard
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              If it keeps happening, reload the app or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;