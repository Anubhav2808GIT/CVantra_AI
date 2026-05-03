from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    report_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)  # analyze | match_jd
    role: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    result_json: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(String(512), nullable=True)

