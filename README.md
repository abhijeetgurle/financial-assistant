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
| `POST` | `/analyze` | Analyze a list of `NormalizedTransaction` objects |

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

The `/analyze` endpoint accepts the `transactions` array from `IngestResponse` and returns:

```json
{
  "flags": [
    {
      "name": "loss_rate",
      "severity": "medium",
      "title": "High Loss Rate",
      "description": "...",
      "evidence": ["..."]
    }
  ],
  "metrics": {
    "realized_pnl": 5042.5,
    "win_rate": 0.375,
    "avg_holding_days": 183,
    "total_trades": 44,
    "unique_symbols": 12,
    "top_symbol": "GOLDBEES",
    "top_symbol_pct": 0.42
  },
  "suggestions": ["..."]
}
```

---

## Behavior Analysis Rules

The engine detects four behavioral patterns:

| Flag | Trigger |
|---|---|
| **Panic Selling** | HIGH if >30% of matched sells are short-term losses; MEDIUM if any sell was held <7 days at a loss |
| **Overtrading** | HIGH if average holding period <30 days; MEDIUM if <90 days |
| **Concentration Risk** | HIGH if one symbol is >60% of total buy value; MEDIUM if >40% |
| **High Loss Rate** | MEDIUM if win rate <40% |

---

## Project Structure

```
financial-assistant/
├── backend/
│   ├── main.py                    # FastAPI app, CORS, health endpoint
│   ├── requirements.txt
│   └── app/
│       ├── models/
│       │   ├── transaction.py     # NormalizedTransaction, IngestResponse (source of truth)
│       │   └── analysis.py        # BehaviorFlag, PortfolioMetrics, AnalysisResult
│       ├── routers/
│       │   ├── ingest.py          # /ingest/csv and /ingest/manual
│       │   └── analyze.py         # /analyze
│       └── services/
│           ├── csv_parser.py      # Zerodha tradebook CSV parser
│           ├── normalizer.py      # FIFO gain/loss matching
│           └── analyzer.py        # Rule-based behavior analysis engine
└── frontend/
    └── src/
        ├── app/
        │   ├── upload/page.tsx    # Upload page
        │   └── analysis/page.tsx  # Analysis results page
        ├── components/            # UploadTabs, CsvUpload, ManualEntryForm, TransactionTable, AnalysisReport
        ├── lib/api.ts             # Typed fetch wrappers
        └── types/
            ├── transaction.ts     # TypeScript mirror of transaction schema
            └── analysis.ts        # TypeScript mirror of analysis schema
```

---

## Roadmap

- [x] Phase 1 — Data ingestion (Zerodha CSV + manual entry, FIFO normalization)
- [x] Phase 2 — Rule-based behavior analysis engine
- [ ] Phase 3 — Claude API integration for plain-language insights
- [ ] Phase 4 — Analysis report UI and shareable results
