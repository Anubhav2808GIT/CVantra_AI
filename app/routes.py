import os
import json
import re
import shutil
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.resume_parser import extract_text
from app.llm import ask_llm
from app.database import get_db
from app.models import Report

router = APIRouter()


def extract_json(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        return match.group(0)
    return text


def report_to_dict(r: Report):
    try:
        parsed = json.loads(r.result_json)
    except Exception:
        parsed = r.result_json

    return {
        "id": r.id,
        "created_at": r.created_at.isoformat(),
        "report_type": r.report_type,
        "role": r.role,
        "filename": r.filename,
        "score": r.score,
        "summary": r.summary,
        "result": parsed,
    }


@router.post("/analyze")
async def analyze_resume(
    role: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    filepath = f"temp_{file.filename}"

    try:
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        resume_text = extract_text(filepath)

        prompt = f"""
            You are a senior technical recruiter.

            Evaluate this resume for role: {role}

            Resume:
            {resume_text}

            Rules:
            - score realistically between 60 and 95
            - exactly 5 interview questions
            - exactly 3 strengths
            - exactly 3 missing_skills
            - verdict only one of:
            Strong Candidate
            Moderate Candidate
            Weak Candidate

            Return ONLY JSON:

            {{
            "score": 0,
            "strengths": ["","",""],
            "missing_skills": ["","",""],
            "questions": ["","","","",""],
            "roadmap": {{
                "week1": "",
                "week2": "",
                "week3": "",
                "week4": ""
            }},
            "verdict": ""
            }}
            """

        result = ask_llm(prompt)

        cleaned = extract_json(result)

        parsed = json.loads(cleaned)

        parsed["score"] = max(0, min(100, int(parsed["score"])))

        report = Report(
            created_at=datetime.utcnow(),
            report_type="analyze",
            role=role,
            filename=file.filename,
            score=int(parsed.get("score", 0)),
            summary=parsed.get("verdict"),
            result_json=json.dumps(parsed),
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return {
            "role": role,
            "analysis": parsed,
            "report_id": report.id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass


@router.post("/match-jd")
async def match_resume_to_jd(
    jd: str = Form(...),
    file: Optional[UploadFile] = File(None),
    resume_text: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if file is None and (resume_text is None or not resume_text.strip()):
        raise HTTPException(status_code=400, detail="Provide either a resume PDF file or resume_text.")

    filepath = f"temp_{file.filename}" if file is not None else None

    try:
        if resume_text is None or not resume_text.strip():
            # Resume provided via file upload.
            assert file is not None and filepath is not None
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            resume_text = extract_text(filepath)

        prompt = f"""
You are a senior technical recruiter and ATS specialist.

Task: Compare the resume to the job description and output a realistic fit score.

Job Description:
{jd}

Resume:
{resume_text}

Rules:
- fit_percentage must be an integer between 0 and 100
- matched_keywords: 8-15 items, only keywords/skills/technologies (no sentences)
- missing_keywords: 8-15 items, only keywords/skills/technologies (no sentences)
- strengths: exactly 3 short bullet-style strings
- concerns: exactly 3 short bullet-style strings
- summary: 2-3 sentences maximum

Return ONLY JSON:
{{
  "fit_percentage": 0,
  "summary": "",
  "matched_keywords": ["..."],
  "missing_keywords": ["..."],
  "strengths": ["", "", ""],
  "concerns": ["", "", ""]
}}
"""

        result = ask_llm(prompt)
        cleaned = extract_json(result)
        parsed = json.loads(cleaned)

        # Normalize output to keep API stable.
        parsed["fit_percentage"] = max(0, min(100, int(parsed.get("fit_percentage", 0))))
        for key in ("matched_keywords", "missing_keywords", "strengths", "concerns"):
            if key not in parsed or not isinstance(parsed[key], list):
                parsed[key] = []

        report = Report(
            created_at=datetime.utcnow(),
            report_type="match_jd",
            role="JD Match",
            filename=file.filename if file is not None else None,
            score=int(parsed.get("fit_percentage", 0)),
            summary=parsed.get("summary"),
            result_json=json.dumps(parsed),
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        return {"match": parsed, "report_id": report.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        try:
            if filepath and os.path.exists(filepath):
                os.remove(filepath)
        except:
            pass


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc(), Report.id.desc()).all()
    return {"reports": [report_to_dict(r) for r in reports]}


@router.get("/reports/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"report": report_to_dict(report)}


@router.delete("/reports/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    db.delete(report)
    db.commit()
    return {"deleted": True, "id": report_id}