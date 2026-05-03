import { clsx } from 'clsx'

type Tone = 'emerald' | 'rose' | 'slate'

function chipTone(tone: Tone) {
  if (tone === 'emerald') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
  if (tone === 'rose') return 'border-rose-400/20 bg-rose-500/10 text-rose-100'
  return 'border-white/10 bg-white/5 text-slate-200'
}

export function ChipGroup(props: { items: string[]; tone?: Tone }) {
  const items = (props.items || []).filter(Boolean).slice(0, 40)
  if (items.length === 0) return <div className="text-xs text-slate-400">No items.</div>

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((k, i) => (
        <span
          key={`${k}-${i}`}
          className={clsx(
            'inline-flex items-center rounded-full border px-2.5 py-1 text-xs',
            chipTone(props.tone ?? 'slate'),
          )}
        >
          {k}
        </span>
      ))}
    </div>
  )
}

