from pydantic import BaseModel
from app.models.analysis import AnalysisResult


class SavedReport(BaseModel):
    id: str
    result: AnalysisResult
    insight: str | None
    created_at: str  # ISO-8601 UTC


class SaveReportRequest(BaseModel):
    result: AnalysisResult
    insight: str | None = None
