from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from app.models.transaction import IngestResponse, ManualEntryInput
from app.services.csv_parser import parse_zerodha_csv
from app.services.normalizer import normalize_csv_rows, normalize_manual_entry

router = APIRouter(prefix="/ingest", tags=["ingest"])

ALLOWED_CONTENT_TYPES = {"text/csv", "application/vnd.ms-excel", "application/octet-stream", "text/plain"}


@router.post("/csv", response_model=IngestResponse)
async def ingest_csv(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=422, detail="Only .csv files are accepted.")

    content = await file.read()

    try:
        rows, warnings, errors = parse_zerodha_csv(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not rows:
        raise HTTPException(
            status_code=422,
            detail="No valid rows found after parsing. Check your file and try again.",
        )

    return normalize_csv_rows(rows, warnings, errors)


@router.post("/manual", response_model=IngestResponse)
def ingest_manual(entry: ManualEntryInput):
    return normalize_manual_entry(entry)
