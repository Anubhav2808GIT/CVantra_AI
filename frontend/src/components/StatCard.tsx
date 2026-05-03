import { clsx } from 'clsx'

type Tone = 'emerald' | 'amber' | 'rose' | 'slate'

function toneClasses(tone: Tone) {
  switch (tone) {
    case 'emerald':
      return 'border-emerald-400/20 bg-emerald-500/10'
    case 'amber':
      return 'border-amber-400/20 bg-amber-500/10'
    case 'rose':
      return 'border-rose-400/20 bg-rose-500/10'
    default:
      return 'border-white/10 bg-slate-950/40'
  }
}

export function StatCard(props: { title: string; value: string; subtitle?: string; tone?: Tone }) {
  return (
    <div className={clsx('rounded-2xl border p-4', toneClasses(props.tone ?? 'slate'))}>
      <div className="text-xs font-medium text-slate-300">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{props.value}</div>
      {props.subtitle ? <div className="mt-1 text-xs text-slate-400">{props.subtitle}</div> : null}
    </div>
  )
}

