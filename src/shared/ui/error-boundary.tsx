'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logError } from '@/shared/lib';

type FallbackProps = { error: unknown; reset: () => void };

type Props = {
  children: ReactNode;
  fallback: (props: FallbackProps) => ReactNode;
  /** Called before re-rendering children, e.g. to reset failed queries. */
  onReset?: () => void;
};

type State = { failed: false } | { failed: true; error: unknown };

/** Catches render errors below it, logs them once and shows `fallback`. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    logError(error, { scope: 'ui', componentStack: info.componentStack });
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ failed: false });
  };

  override render(): ReactNode {
    if (this.state.failed)
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    return this.props.children;
  }
}
