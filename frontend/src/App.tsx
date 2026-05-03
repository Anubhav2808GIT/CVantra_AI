import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { clsx } from 'clsx'
import { analyzeResume, deleteReport, getReport, listReports, matchResumeToJd } from './lib/api'
import type { AnalyzeResponse, MatchJdResponse } from './lib/types'
import { Dropzone } from './components/Dropzone'
import { Field, Textarea, TextInput } from './components/Field'
import { StatCard } from './components/StatCard'
import { ChipGroup } from './components/ChipGroup'
import { Spinner } from './components/Spinner'

type Tab = 'match' | 'analyze' | 'reports'

function scoreToTone(score: number) {
  if (score >= 80) return 'emerald'
  if (score >= 65) return 'amber'
  return 'rose'
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function App() {
  const [tab, setTab] = useState<Tab>('match')
  const [file, setFile] = useState<File | null>(null)
  const [role, setRole] = useState('')
  const [jd, setJd] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matchResult, setMatchResult] = useState<MatchJdResponse | null>(null)
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(null)

  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsError, setReportsError] = useState<string | null>(null)
  const [reports, setReports] = useState<
    Array<{
      id: number
      created_at: string
      report_type: string
      role: string
      filename: string | null
      score: number | null
      summary: string | null
      result: unknown
    }>
  >([])
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [selectedReport, setSelectedReport] = useState<{
    id: number
    created_at: string
    report_type: string
    role: string
    filename: string | null
    score: number | null
    summary: string | null
    result: unknown
  } | null>(null)

  // Backward-compatible: older backend responses used "match_jd"; new uses "match".
  const matchPayload =
    (matchResult as unknown as { match?: MatchJdResponse['match']; match_jd?: MatchJdResponse['match'] })?.match ??
    (matchResult as unknown as { match?: MatchJdResponse['match']; match_jd?: MatchJdResponse['match'] })?.match_jd ??
    null

  const matchFit = matchPayload?.fit_percentage ?? null
  const matchTone = scoreToTone(matchFit ?? 0)

  const pieData = useMemo(() => {
    const m = matchPayload
    if (!m) return []
    return [
      { name: 'Matched', value: m.matched_keywords.length },
      { name: 'Missing', value: m.missing_keywords.length },
    ]
  }, [matchPayload])

  const barData = useMemo(() => {
    const a = analyzeResult?.analysis
    if (!a) return []
    return [
      { name: 'Score', value: a.score },
      { name: 'Missing skills', value: a.missing_skills.length * 10 },
    ]
  }, [analyzeResult])

  async function refreshReports() {
    try {
      setReportsError(null)
      setReportsLoading(true)
      const res = await listReports()
      setReports(res.reports)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load reports.'
      setReportsError(msg)
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'reports') {
      void refreshReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function onSubmit() {
    setError(null)
    setMatchResult(null)
    setAnalyzeResult(null)

    if (!file) {
      setError('Please upload a resume PDF first.')
      return
    }

    try {
      setLoading(true)
      if (tab === 'match') {
        if (!jd.trim()) {
          setError('Please paste a job description.')
          return
        }
        const res = await matchResumeToJd({ jd, file })
        setMatchResult(res)
      } else {
        if (!role.trim()) {
          setError('Please enter a target role (e.g., "Backend Engineer").')
          return
        }
        const res = await analyzeResume({ role, file })
        setAnalyzeResult(res)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-500/25 via-fuchsia-500/15 to-cyan-500/20 blur-3xl" />
      </div>

      <header className="relative mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Local LLM via Ollama
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              AI Interview Copilot
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
              Upload a resume, paste a job description, and get an ATS-style match score with gaps, strengths, and
              interview prep.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">FastAPI</span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">React</span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">Recharts</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('match')}
            className={clsx(
              'rounded-xl border px-4 py-2 text-sm transition',
              tab === 'match'
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            JD Match Score
          </button>
          <button
            type="button"
            onClick={() => setTab('analyze')}
            className={clsx(
              'rounded-xl border px-4 py-2 text-sm transition',
              tab === 'analyze'
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            Resume Role Analysis
          </button>
          <button
            type="button"
            onClick={() => setTab('reports')}
            className={clsx(
              'rounded-xl border px-4 py-2 text-sm transition',
              tab === 'reports'
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
            )}
          >
            Reports
          </button>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 pb-16 pt-8 lg:grid-cols-5">
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">{tab === 'reports' ? 'Actions' : 'Inputs'}</h2>
            <p className="mt-1 text-sm text-slate-300">
              {tab === 'reports' ? 'Manage saved analysis history.' : 'Upload once, then run either workflow.'}
            </p>

            {tab === 'reports' ? (
              <div className="mt-5 space-y-4">
                <button
                  type="button"
                  onClick={refreshReports}
                  disabled={reportsLoading}
                  className={clsx(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition',
                    reportsLoading ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10',
                  )}
                >
                  {reportsLoading ? (
                    <>
                      <Spinner /> Refreshing…
                    </>
                  ) : (
                    'Refresh reports'
                  )}
                </button>
                <div className="text-xs text-slate-400">
                  Reports are stored in SQLite on the backend and persist across restarts.
                </div>
                {reportsError ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {reportsError}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mt-5">
                  <Dropzone file={file} onFile={setFile} />
                </div>

                <div className="mt-5 space-y-4">
                  {tab === 'match' ? (
                    <Field label="Job description (paste)">
                      <Textarea
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        rows={10}
                        placeholder="Paste the job description here…"
                      />
                    </Field>
                  ) : (
                    <Field label="Target role">
                      <TextInput
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder='e.g. "Backend Engineer (Python)"'
                      />
                    </Field>
                  )}

                  {error ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={loading}
                    className={clsx(
                      'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition',
                      loading ? 'bg-white/10' : 'bg-indigo-500 hover:bg-indigo-400',
                    )}
                  >
                    {loading ? (
                      <>
                        <Spinner /> Running analysis…
                      </>
                    ) : tab === 'match' ? (
                      'Get match score'
                    ) : (
                      'Analyze resume'
                    )}
                  </button>

                  <p className="text-xs text-slate-400">
                    Tip: For the best results, use a resume PDF with selectable text (not scanned images).
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="lg:col-span-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-base font-semibold text-white">Results</h2>
            <p className="mt-1 text-sm text-slate-300">
              {tab === 'reports'
                ? 'Your saved history (persisted in SQLite).'
                : tab === 'match'
                ? 'Fit score + matched vs missing keywords.'
                : 'Recruiter-style score, strengths, missing skills, interview questions, and a 4-week roadmap.'}
            </p>

            {tab === 'reports' ? (
              <div className="mt-6 space-y-4">
                {reportsLoading ? (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-300">
                    <Spinner /> Loading reports…
                  </div>
                ) : reports.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="space-y-3">
                    {reports.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-white">
                              #{r.id} · {r.report_type}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              {formatDate(r.created_at)}
                              {r.filename ? ` · ${r.filename}` : ''}
                            </div>
                            <div className="mt-2 text-sm text-slate-200">
                              <span className="text-slate-400">Role:</span> {r.role || '—'}
                            </div>
                            {r.summary ? (
                              <div className="mt-1 text-sm text-slate-300">{r.summary}</div>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            {typeof r.score === 'number' ? (
                              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                                Score: {r.score}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={async () => {
                                setSelectedReportId(r.id)
                                try {
                                  const res = await getReport(r.id)
                                  setSelectedReport(res.report)
                                } catch (e) {
                                  const msg = e instanceof Error ? e.message : 'Failed to load report.'
                                  setReportsError(msg)
                                }
                              }}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`Delete report #${r.id}?`)) return
                                try {
                                  await deleteReport(r.id)
                                  setReports((prev) => prev.filter((x) => x.id !== r.id))
                                  if (selectedReportId === r.id) {
                                    setSelectedReportId(null)
                                    setSelectedReport(null)
                                  }
                                } catch (e) {
                                  const msg = e instanceof Error ? e.message : 'Failed to delete report.'
                                  setReportsError(msg)
                                }
                              }}
                              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </div>

                        {selectedReportId === r.id && selectedReport ? (
                          <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                            <div className="text-xs font-medium text-slate-300">Full result JSON</div>
                            <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-black/30 p-3 text-xs text-slate-200">
                              {JSON.stringify(selectedReport.result, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : tab === 'match' ? (
              matchResult ? (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard
                      title="Fit score"
                      value={`${matchPayload?.fit_percentage ?? 0}%`}
                      tone={matchTone}
                      subtitle="ATS-style match estimate"
                    />
                    <StatCard
                      title="Matched"
                      value={`${matchPayload?.matched_keywords?.length ?? 0}`}
                      tone="slate"
                      subtitle="Keywords found in resume"
                    />
                    <StatCard
                      title="Missing"
                      value={`${matchPayload?.missing_keywords?.length ?? 0}`}
                      tone="slate"
                      subtitle="Keywords to focus on"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Keyword coverage</div>
                      <div className="mt-3 h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80}>
                              {pieData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.name === 'Matched' ? 'rgb(52 211 153)' : 'rgb(251 113 133)'}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(2,6,23,0.92)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                borderRadius: 12,
                                color: 'white',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">Matched vs missing keyword counts.</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Summary</div>
                      <p className="mt-2 text-sm text-slate-200">{matchPayload?.summary ?? ''}</p>
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-xs font-medium text-slate-300">Strengths</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {(matchPayload?.strengths ?? []).map((s, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-slate-300">Concerns</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-200">
                            {(matchPayload?.concerns ?? []).map((s, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-rose-400" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Matched keywords</div>
                      <div className="mt-3">
                        <ChipGroup items={matchPayload?.matched_keywords ?? []} tone="emerald" />
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-sm font-medium text-white">Missing keywords</div>
                      <div className="mt-3">
                        <ChipGroup items={matchPayload?.missing_keywords ?? []} tone="rose" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState />
              )
            ) : analyzeResult ? (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    title="Recruiter score"
                    value={`${analyzeResult.analysis.score}`}
                    tone={scoreToTone(analyzeResult.analysis.score)}
                    subtitle="(60–95 realistic range)"
                  />
                  <StatCard title="Verdict" value={analyzeResult.analysis.verdict} tone="slate" subtitle={analyzeResult.role} />
                  <StatCard
                    title="Questions"
                    value={`${analyzeResult.analysis.questions.length}`}
                    tone="slate"
                    subtitle="Interview questions generated"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-sm font-medium text-white">Overview</div>
                    <div className="mt-3 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ left: 8, right: 8 }}>
                          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(226,232,240,0.7)" />
                          <YAxis stroke="rgba(226,232,240,0.7)" />
                          <Tooltip
                            contentStyle={{
                              background: 'rgba(2,6,23,0.92)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              borderRadius: 12,
                              color: 'white',
                            }}
                          />
                          <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                            {barData.map((_, idx) => (
                              <Cell key={idx} fill={idx === 0 ? 'rgb(99 102 241)' : 'rgb(251 113 133)'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">A simple snapshot for demo purposes.</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-sm font-medium text-white">Strengths</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {analyzeResult.analysis.strengths.map((s, i) => (
                        <li key={i} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          {s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 text-sm font-medium text-white">Missing skills</div>
                    <div className="mt-3">
                      <ChipGroup items={analyzeResult.analysis.missing_skills} tone="rose" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-sm font-medium text-white">Interview questions</div>
                    <ol className="mt-3 space-y-2 text-sm text-slate-200">
                      {analyzeResult.analysis.questions.map((q, i) => (
                        <li key={i} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <span className="mr-2 text-slate-400">{i + 1}.</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-sm font-medium text-white">4-week roadmap</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                      {(['week1', 'week2', 'week3', 'week4'] as const).map((w) => (
                        <div key={w} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                          <div className="text-xs font-medium text-slate-300">{w.toUpperCase()}</div>
                          <div className="mt-1">{analyzeResult.analysis.roadmap[w]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </main>

      <footer className="relative mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-400">
        Built for demo: FastAPI + Ollama + React. Keep your resume data local.
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8">
      <div className="text-sm font-medium text-white">No results yet</div>
      <div className="mt-1 text-sm text-slate-300">
        Upload your resume, fill the inputs on the left, then run an analysis.
      </div>
    </div>
  )
}

export default App
