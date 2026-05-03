from pydantic import BaseModel, Field, field_validator
from datetime import date
from enum import Enum
from typing import Optional
import re


class TransactionType(str, Enum):
    BUY = "buy"
    SELL = "sell"


class NormalizedTransaction(BaseModel):
    symbol: str
    transaction_type: TransactionType
    price: float
    quantity: float
    date: date
    exchange: Optional[str] = None
    segment: Optional[str] = None
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None
    gain_loss: Optional[float] = None
    holding_days: Optional[int] = None
    source: str


class IngestResponse(BaseModel):
    transactions: list[NormalizedTransaction]
    row_count: int
    warnings: list[str]
    errors: list[str]


class ManualEntryInput(BaseModel):
    symbol: str
    type: TransactionType
    price: float
    quantity: float
    date: date
    buy_price: Optional[float] = None
    sell_price: Optional[float] = None

    @field_validator("symbol")
    @classmethod
    def validate_symbol(cls, v: str) -> str:
        v = v.strip().upper()
        # Allow standard tickers and Indian market formats (e.g. BRK-B, NIFTY50)
        if not re.match(r"^[A-Z0-9&\-\.]{1,20}$", v):
            raise ValueError("Invalid ticker symbol format")
        return v

    @field_validator("price", "quantity")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Must be greater than 0")
        return v

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: date) -> date:
        from datetime import date as date_type
        if v > date_type.today():
            raise ValueError("Date cannot be in the future")
        if v.year < 1970:
            raise ValueError("Date before 1970 is implausible")
        return v

    @field_validator("buy_price", "sell_price")
    @classmethod
    def optional_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Must be greater than 0")
        return v
