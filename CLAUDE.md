# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Behavioral Finance Assistant — helps retail investors understand *why* they make poor decisions (panic selling, overtrading, concentration risk). Not a stock prediction tool. The target user is a Zerodha customer.

## Commands

### Backend (FastAPI + Python)

```bash
cd backend
python3 -m venv venv          # first-time only
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install                   # first-time only
npm run dev                   # dev server on :3000
npm run build                 # production build + type check
```

### Test an endpoint manually

```bash
curl -X POST http://localhost:8000/ingest/csv -F "file=@frontend/public/sample.csv"
curl -X POST http://localhost:8000/ingest/manual \
  -H "Content-Type: application/json" \
  -d '{"symbol":"RELIANCE","type":"sell","price":2800,"quantity":5,"date":"2024-07-01","buy_price":2500}'
curl http://localhost:8000/health
```

## Architecture

### Request flow

```
Browser → Next.js (frontend/)
            ↓
        lib/api.ts  (typed fetch)
            ↓
        FastAPI (backend/) on :8000
            ↓
        routers/ingest.py
            ├── POST /ingest/csv   → csv_parser.py → normalizer.py
            └── POST /ingest/manual → Pydantic validation → normalizer.py
                                          ↓
                                   IngestResponse (JSON)
                                          ↓
                                   TransactionTable.tsx
```

### The contract: `NormalizedTransaction`

Both input paths (CSV and manual) produce the same `IngestResponse` shape. The schema is defined in two places that must stay in sync:

- **Python source of truth**: `backend/app/models/transaction.py` — `NormalizedTransaction`, `IngestResponse`, `ManualEntryInput`
- **TypeScript mirror**: `frontend/src/types/transaction.ts`

Key fields: `symbol`, `transaction_type` (buy/sell), `price`, `quantity`, `date`, `exchange`, `segment` (EQ/FO/COM), `gain_loss`, `holding_days`, `source` ("csv" | "manual").

`gain_loss` and `holding_days` are computed by `normalizer.py` using FIFO matching — they are `null` for BUY rows and for SELL rows with no matching BUY in the same batch.

### CSV parsing targets Zerodha Tradebook format

The parser (`backend/app/services/csv_parser.py`) only accepts the Zerodha Tradebook CSV exported from `console.zerodha.com → Reports → Tradebook`. Required columns: `trade_date`, `tradingsymbol`, `trade_type`, `quantity`, `price`. Any other CSV format returns a user-facing 422 with instructions to download from Zerodha.

F&O symbols (e.g. `NIFTY2430622000CE`) are preserved as-is; the `segment` field (FO vs EQ) is used to distinguish them.

### Frontend state handoff between phases

After Phase 1 (ingestion), `UploadTabs.tsx` stores the `IngestResponse` in `sessionStorage` under the key `"transactions"` and navigates to `/analysis`. Phase 2 reads from there.

### Next.js version note

This project uses **Next.js 16** (App Router). Before modifying frontend code, check `node_modules/next/dist/docs/` — APIs and conventions differ significantly from older versions.

## Environment variables

| File | Variable | Default |
|---|---|---|
| `backend/.env` | `CORS_ORIGINS` | `http://localhost:3000` |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |

## Planned phases

- **Phase 1** ✅ — Data ingestion (CSV + manual entry, normalization)
- **Phase 2** — Rule-based behavior analysis engine (`analyzer.py`)
- **Phase 3** — Claude API integration (convert analysis signals → human-readable insights)
- **Phase 4** — Report UI (`/analysis` page)
