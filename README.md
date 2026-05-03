# AI Behavioral Finance Assistant

Helps retail investors understand **why** they make poor financial decisions — not what to buy or sell, but how to recognize and improve their own investing behavior.

> Not a stock prediction tool. Not a trading signal platform.
> A decision intelligence + behavior analysis system.

---

## What it does

Upload your Zerodha tradebook and get:

- **Behavioral pattern detection** — panic selling, overtrading, concentration risk
- **Plain-language portfolio explanation** — "60% of your portfolio is in one stock"
- **Risk summary** — concentration, volatility exposure, holding period analysis
- **Actionable suggestions** — without giving financial advice

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (TypeScript, Tailwind CSS) |
| Backend | FastAPI (Python 3.11+) |
| Data processing | pandas |
| AI insights | Claude API (coming in Phase 3) |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python3 -m venv venv
venv/bin/pip install -r requirements.txt
venv/bin/uvicorn main:app --reload
```

API runs at `http://localhost:8000`. Verify with:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000` and redirects to `/upload`.

---

## Usage

### Option 1: Upload Zerodha Tradebook CSV

1. Log into [console.zerodha.com](https://console.zerodha.com)
2. Go to **Reports → Tradebook**
3. Select your date range and download as CSV
4. Upload the file on the app

A sample CSV is available at `frontend/public/sample.csv` to try without real data.

### Option 2: Manual Entry

Enter individual trades directly — symbol, type (buy/sell), price, quantity, and date.

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Liveness check |
| `POST` | `/ingest/csv` | Upload Zerodha tradebook CSV |
| `POST` | `/ingest/manual` | Submit a single transaction as JSON |

Both ingest endpoints return the same `IngestResponse` shape:

```json
{
  "transactions": [...],
  "row_count": 15,
  "warnings": [],
  "errors": []
}
```

Each transaction includes `gain_loss` and `holding_days` computed via FIFO matching when a matching buy exists in the same batch.

---

## Project Structure

```
financial-assistant/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, health endpoint
│   ├── requirements.txt
│   └── app/
│       ├── models/transaction.py  # Pydantic schema (source of truth)
│       ├── routers/ingest.py      # /ingest/csv and /ingest/manual
│       └── services/
│           ├── csv_parser.py      # Zerodha tradebook CSV parser
│           └── normalizer.py      # FIFO gain/loss matching
└── frontend/
    └── src/
        ├── app/upload/page.tsx    # Main upload page
        ├── components/            # UploadTabs, CsvUpload, ManualEntryForm, TransactionTable
        ├── lib/api.ts             # Typed fetch wrappers
        └── types/transaction.ts   # TypeScript mirror of backend schema
```

---

## Roadmap

- [x] Phase 1 — Data ingestion (Zerodha CSV + manual entry, FIFO normalization)
- [ ] Phase 2 — Rule-based behavior analysis engine
- [ ] Phase 3 — Claude API integration for plain-language insights
- [ ] Phase 4 — Analysis report UI and shareable results
