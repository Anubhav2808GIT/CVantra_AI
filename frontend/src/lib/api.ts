import axios from 'axios'
import type { AnalyzeResponse, MatchJdResponse } from './types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
})

function toFormData(fields: Record<string, string>, file?: File) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  if (file) fd.append('file', file)
  return fd
}

export async function analyzeResume(input: { role: string; file: File }): Promise<AnalyzeResponse> {
  const fd = toFormData({ role: input.role }, input.file)
  const { data } = await api.post<AnalyzeResponse>('/analyze', fd)
  return data
}

export async function matchResumeToJd(input: { jd: string; file: File }): Promise<MatchJdResponse> {
  const fd = toFormData({ jd: input.jd }, input.file)
  const { data } = await api.post<MatchJdResponse>('/match-jd', fd)
  return data
}

export type ReportListResponse = {
  reports: Array<{
    id: number
    created_at: string
    report_type: string
    role: string
    filename: string | null
    score: number | null
    summary: string | null
    result: unknown
  }>
}

export type ReportGetResponse = {
  report: ReportListResponse['reports'][number]
}

export async function listReports(): Promise<ReportListResponse> {
  const { data } = await api.get<ReportListResponse>('/reports')
  return data
}

export async function getReport(id: number): Promise<ReportGetResponse> {
  const { data } = await api.get<ReportGetResponse>(`/reports/${id}`)
  return data
}

export async function deleteReport(id: number): Promise<{ deleted: boolean; id: number }> {
  const { data } = await api.delete<{ deleted: boolean; id: number }>(`/reports/${id}`)
  return data
}

