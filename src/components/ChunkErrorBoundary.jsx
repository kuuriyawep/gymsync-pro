import React from 'react';

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

class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasChunkError: false };
  }

  static getDerivedStateFromError(error) {
    if (isChunkLoadError(error)) {
      return { hasChunkError: true };
    }
    return null;
  }

  componentDidUpdate(_prevProps, prevState) {
    if (!prevState.hasChunkError && this.state.hasChunkError) {
      window.location.reload();
    }
  }

  componentDidCatch(error, info) {
    if (!isChunkLoadError(error)) {
      // Re-throw non-chunk errors so other error boundaries can handle them
      throw error;
    }
  }

  render() {
    // While reload is in flight, render nothing (or a loader)
    if (this.state.hasChunkError) {
      return null;
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
