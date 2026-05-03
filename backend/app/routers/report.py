import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException

from app.models.report import SavedReport, SaveReportRequest

router = APIRouter(prefix="/report", tags=["report"])

REPORTS_DIR = Path("data/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/save", response_model=dict)
def save_report(body: SaveReportRequest) -> dict:
    report_id = str(uuid.uuid4())
    report = SavedReport(
        id=report_id,
        result=body.result,
        insight=body.insight,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    path = REPORTS_DIR / f"{report_id}.json"
    path.write_text(report.model_dump_json())
    return {"id": report_id, "url": f"/report/{report_id}"}


@router.get("/{report_id}", response_model=SavedReport)
def get_report(report_id: str) -> SavedReport:
    path = REPORTS_DIR / f"{report_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="Report not found.")
    return SavedReport.model_validate_json(path.read_text())
