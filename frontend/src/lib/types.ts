export type AnalyzeResponse = {
  role: string
  analysis: {
    score: number
    strengths: string[]
    missing_skills: string[]
    questions: string[]
    roadmap: {
      week1: string
      week2: string
      week3: string
      week4: string
    }
    verdict: string
  }
  report_id: number
}

export type MatchJdResponse = {
  match: {
    fit_percentage: number
    summary: string
    matched_keywords: string[]
    missing_keywords: string[]
    strengths: string[]
    concerns: string[]
  }
  report_id: number
}

