import type { ReactNode, TextareaHTMLAttributes, InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-4">
        <div className="text-sm font-medium text-white">{props.label}</div>
        {props.hint ? <div className="text-xs text-slate-400">{props.hint}</div> : null}
      </div>
      <div className="mt-2">{props.children}</div>
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none',
        'focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20',
        props.className,
      )}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={clsx(
        'w-full resize-y rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none',
        'focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/20',
        props.className,
      )}
    />
  )
}

