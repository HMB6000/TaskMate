import { Component, type ErrorInfo, type ReactNode } from "react";

/** Catches render errors so a bug shows a friendly recovery screen instead of a blank page. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Task Mate crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div role="alert" className="card max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold">Something went wrong</h1>
          <p className="mt-2 text-mute">
            Your work is saved. Reloading the page usually fixes this. If it keeps happening, let the person who set up Task Mate know.
          </p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => window.location.reload()}>Reload Task Mate</button>
        </div>
      </main>
    );
  }
}
