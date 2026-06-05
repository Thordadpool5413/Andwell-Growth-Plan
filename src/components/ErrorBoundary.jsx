import React, { Component } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== "undefined" && window.__vite_plugin_react_preamble_installed__) {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false, error: null })} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }) {
  const { dark } = useDarkMode();
  return (
    <div className={`flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center ${dark ? "text-slate-300" : "text-slate-700"}`}>
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${dark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-600"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div>
        <p className={`text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Something went wrong</p>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {error?.message || "An unexpected error occurred."}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReset}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${dark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-800 text-white hover:bg-slate-700"}`}
        >
          Try again
        </button>
        <button
          onClick={() => window.location.reload()}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${dark ? "border border-slate-600 text-slate-300 hover:bg-slate-800" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
