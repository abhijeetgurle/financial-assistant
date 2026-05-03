from collections import defaultdict
from datetime import date
from typing import Any

from app.models.transaction import NormalizedTransaction, TransactionType, IngestResponse, ManualEntryInput


def normalize_csv_rows(rows: list[dict[str, Any]], warnings: list[str], errors: list[str]) -> IngestResponse:
    """Convert parsed CSV rows into NormalizedTransactions with FIFO gain/loss matching."""
    # buy_queue[symbol] = list of (date, price, quantity_remaining)
    buy_queue: dict[str, list[list[Any]]] = defaultdict(list)
    transactions: list[NormalizedTransaction] = []

    for row in rows:
        symbol = row["symbol"]
        t_type = TransactionType(row["transaction_type"])
        price = row["price"]
        quantity = row["quantity"]
        trade_date: date = row["date"]

        if t_type == TransactionType.BUY:
            buy_queue[symbol].append([trade_date, price, quantity])
            transactions.append(NormalizedTransaction(
                symbol=symbol,
                transaction_type=t_type,
                price=price,
                quantity=quantity,
                date=trade_date,
                exchange=row.get("exchange"),
                segment=row.get("segment"),
                source="csv",
            ))
        else:
            # FIFO match against buys
            remaining = quantity
            total_cost = 0.0
            earliest_buy_date: date | None = None
            matched = False

            queue = buy_queue[symbol]
            while queue and remaining > 0:
                buy_entry = queue[0]
                buy_date, buy_price, buy_qty = buy_entry
                if earliest_buy_date is None:
                    earliest_buy_date = buy_date

                consume = min(remaining, buy_qty)
                total_cost += consume * buy_price
                remaining -= consume
                buy_entry[2] -= consume
                if buy_entry[2] <= 0:
                    queue.pop(0)
                matched = True

            matched_qty = quantity - remaining
            gain_loss: float | None = None
            holding_days: int | None = None

            if matched and matched_qty > 0 and earliest_buy_date is not None:
                avg_buy_price = total_cost / matched_qty
                gain_loss = round((price - avg_buy_price) * matched_qty, 4)
                holding_days = (trade_date - earliest_buy_date).days

            transactions.append(NormalizedTransaction(
                symbol=symbol,
                transaction_type=t_type,
                price=price,
                quantity=quantity,
                date=trade_date,
                exchange=row.get("exchange"),
                segment=row.get("segment"),
                sell_price=price,
                gain_loss=gain_loss,
                holding_days=holding_days,
                source="csv",
            ))

    return IngestResponse(
        transactions=transactions,
        row_count=len(transactions),
        warnings=warnings,
        errors=errors,
    )


def normalize_manual_entry(entry: ManualEntryInput) -> IngestResponse:
    """Convert a single manual entry into a NormalizedTransaction."""
    warnings: list[str] = []
    gain_loss: float | None = None

    if entry.type == TransactionType.SELL:
        if entry.sell_price and entry.buy_price:
            gain_loss = round((entry.sell_price - entry.buy_price) * entry.quantity, 4)
        elif entry.sell_price and not entry.buy_price:
            warnings.append("sell_price provided without buy_price — gain/loss cannot be computed.")

    tx = NormalizedTransaction(
        symbol=entry.symbol,
        transaction_type=entry.type,
        price=entry.price,
        quantity=entry.quantity,
        date=entry.date,
        buy_price=entry.buy_price,
        sell_price=entry.sell_price,
        gain_loss=gain_loss,
        source="manual",
    )

    return IngestResponse(
        transactions=[tx],
        row_count=1,
        warnings=warnings,
        errors=[],
    )
