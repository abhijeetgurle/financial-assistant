from fastapi import APIRouter, HTTPException

from app.models.transaction import NormalizedTransaction
from app.models.analysis import AnalysisResult
from app.services.analyzer import analyze

router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalysisResult)
def analyze_transactions(transactions: list[NormalizedTransaction]) -> AnalysisResult:
    if not transactions:
        raise HTTPException(status_code=422, detail="Transaction list cannot be empty.")
    return analyze(transactions)
