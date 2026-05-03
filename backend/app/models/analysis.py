from pydantic import BaseModel
from typing import Literal

Severity = Literal["high", "medium", "low"]


class BehaviorFlag(BaseModel):
    name: str
    severity: Severity
    title: str
    description: str
    evidence: list[str]


class PortfolioMetrics(BaseModel):
    total_buy_value: float
    total_sell_value: float
    realized_pnl: float
    win_rate: float               # fraction 0.0–1.0
    avg_holding_days: float | None
    total_trades: int
    unique_symbols: int
    top_symbol: str | None
    top_symbol_pct: float | None  # fraction 0.0–1.0


class AnalysisResult(BaseModel):
    flags: list[BehaviorFlag]
    metrics: PortfolioMetrics
    suggestions: list[str]        # max 3 items
