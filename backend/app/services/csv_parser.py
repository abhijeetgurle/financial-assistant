import io
import pandas as pd
from typing import Any

REQUIRED_COLUMNS_BASE = {"trade_date", "trade_type", "quantity", "price"}
# Zerodha exports use either 'tradingsymbol' or 'symbol' depending on the report version
SYMBOL_COLUMN_ALIASES = ("tradingsymbol", "symbol")
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ZERODHA_ERROR = (
    "This doesn't look like a Zerodha Tradebook CSV. "
    "Download it from console.zerodha.com → Reports → Tradebook."
)


def parse_zerodha_csv(content: bytes) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    """
    Parse a Zerodha tradebook CSV and return (rows, warnings, errors).
    Rows are dicts ready for the normalizer.
    """
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File exceeds 5 MB limit.")

    try:
        df = pd.read_csv(io.BytesIO(content), encoding="utf-8-sig")
    except Exception as e:
        raise ValueError(f"Could not read CSV: {e}")

    # Normalize column names
    df.columns = df.columns.str.strip().str.lower()

    # Detect which symbol column name this export uses
    symbol_col = next((c for c in SYMBOL_COLUMN_ALIASES if c in df.columns), None)
    if symbol_col is None or not REQUIRED_COLUMNS_BASE.issubset(df.columns):
        raise ValueError(ZERODHA_ERROR)

    if df.empty:
        raise ValueError("CSV file contains no data rows.")

    warnings: list[str] = []
    errors: list[str] = []
    rows: list[dict[str, Any]] = []

    for idx, row in df.iterrows():
        row_num = int(idx) + 2  # 1-based, account for header row

        # --- symbol ---
        symbol = str(row.get(symbol_col, "")).strip().upper()
        if not symbol:
            warnings.append(f"Row {row_num}: empty symbol, skipped.")
            continue

        # --- transaction type ---
        raw_type = str(row.get("trade_type", "")).strip().lower()
        if raw_type in ("buy", "b"):
            transaction_type = "buy"
        elif raw_type in ("sell", "s"):
            transaction_type = "sell"
        else:
            warnings.append(f"Row {row_num}: unknown trade_type '{raw_type}', skipped.")
            continue

        # --- date ---
        raw_date = row.get("trade_date")
        parsed_date = pd.to_datetime(raw_date, errors="coerce")
        if pd.isna(parsed_date):
            warnings.append(f"Row {row_num}: unparseable date '{raw_date}', skipped.")
            continue
        trade_date = parsed_date.date()

        # --- price ---
        try:
            price = float(row["price"])
            if price <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            warnings.append(f"Row {row_num}: invalid price '{row.get('price')}', skipped.")
            continue

        # --- quantity ---
        try:
            quantity = float(row["quantity"])
            if quantity <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            warnings.append(f"Row {row_num}: invalid quantity '{row.get('quantity')}', skipped.")
            continue

        # --- optional metadata ---
        exchange = str(row.get("exchange", "")).strip().upper() or None
        segment = str(row.get("segment", "")).strip().upper() or None
        order_id = str(row.get("order_id", "")).strip() or None
        trade_id = str(row.get("trade_id", "")).strip() or None

        rows.append({
            "symbol": symbol,
            "transaction_type": transaction_type,
            "price": price,
            "quantity": quantity,
            "date": trade_date,
            "exchange": exchange,
            "segment": segment,
            "order_id": order_id,
            "trade_id": trade_id,
        })

    return rows, warnings, errors
