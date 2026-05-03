from fastapi import APIRouter, HTTPException

from app.models.analysis import AnalysisResult
from app.services.insights import generate_insight

router = APIRouter(prefix="/insights", tags=["insights"])


@router.post("", response_model=dict)
def get_insights(result: AnalysisResult) -> dict:
    try:
        insight = generate_insight(result)
        return {"insight": insight}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate insight.")
