from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.database import Base, engine
from app import models  # noqa: F401

app = FastAPI(
    title="AI Interview Copilot API",
    description="Analyze resumes using local LLMs",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    # Auto-create tables on startup (safe for SQLite).
    Base.metadata.create_all(bind=engine)

app.include_router(router)