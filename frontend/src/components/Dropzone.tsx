import { useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { clsx } from 'clsx'

const acceptPdf = { 'application/pdf': ['.pdf'] }

export function Dropzone(props: { file: File | null; onFile: (f: File | null) => void }) {
  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: acceptPdf,
    multiple: false,
    onDrop: (files) => {
      props.onFile(files?.[0] ?? null)
    },
  })

  const rejectionText = useMemo(() => {
    const first = fileRejections[0]
    if (!first) return null
    const msg = first.errors?.[0]?.message ?? 'File rejected.'
    return msg
  }, [fileRejections])

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          'cursor-pointer rounded-2xl border px-4 py-4 transition',
          isDragActive ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 bg-slate-950/40 hover:bg-white/5',
        )}
      >
        <input {...getInputProps()} />
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <span className="text-sm">PDF</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">
              {props.file ? 'Resume selected' : 'Upload resume (PDF)'}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              {props.file ? (
                <span className="truncate">
                  {props.file.name} · {(props.file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              ) : (
                'Drag & drop or click to select'
              )}
            </div>
          </div>
        </div>
      </div>

      {props.file ? (
        <button
          type="button"
          onClick={() => props.onFile(null)}
          className="mt-2 text-xs text-slate-300 underline decoration-white/20 underline-offset-4 hover:text-white"
        >
          Remove file
        </button>
      ) : null}

      {rejectionText ? (
        <div className="mt-2 text-xs text-rose-200">{rejectionText}</div>
      ) : (
        <div className="mt-2 text-xs text-slate-500">Supported: PDF only</div>
      )}
    </div>
  )
}

