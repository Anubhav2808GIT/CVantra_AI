import type { ReactNode } from 'react'
import { Component } from 'react'

type Props = { children: ReactNode }
type State = { error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6">
            <div className="text-sm font-semibold text-white">The dashboard crashed</div>
            <div className="mt-2 text-sm text-rose-100">
              Usually this is caused by an unexpected API response shape. Refresh the page after the server updates.
            </div>
            <pre className="mt-4 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-slate-200">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}

