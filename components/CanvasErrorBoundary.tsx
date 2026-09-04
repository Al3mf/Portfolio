"use client";

import { Component, type ReactNode } from "react";

/**
 * Keeps a WebGL failure (context loss, unsupported device) from taking the
 * rest of the page down with it. On error we just render nothing.
 */
export default class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
