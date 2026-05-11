"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-5xl mb-6">🎬</div>
            <h1 className="text-xl font-bold mb-2 text-orange-400">
              예상치 못한 오류가 발생했습니다
            </h1>
            <p className="text-gray-400 text-sm mb-6">
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>
            {this.state.error && (
              <p className="text-xs text-gray-600 mb-6 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-black font-semibold px-6 py-2 rounded transition-colors text-sm"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
