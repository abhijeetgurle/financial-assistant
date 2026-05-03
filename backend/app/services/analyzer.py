from app.models.transaction import NormalizedTransaction, TransactionType
from app.models.analysis import AnalysisResult, BehaviorFlag, PortfolioMetrics, Severity


def analyze(transactions: list[NormalizedTransaction]) -> AnalysisResult:
    metrics = _compute_metrics(transactions)
    flags: list[BehaviorFlag] = []
    _check_panic_selling(transactions, flags)
    _check_overtrading(transactions, flags)
    _check_concentration_risk(transactions, flags)
    _check_loss_rate(transactions, flags)
    suggestions = _build_suggestions(flags, metrics)
    return AnalysisResult(flags=flags, metrics=metrics, suggestions=suggestions)


def _compute_metrics(transactions: list[NormalizedTransaction]) -> PortfolioMetrics:
    buys = [t for t in transactions if t.transaction_type == TransactionType.BUY]
    sells = [t for t in transactions if t.transaction_type == TransactionType.SELL]
    matched_sells = [t for t in sells if t.gain_loss is not None]

    total_buy_value = sum(t.price * t.quantity for t in buys)
    total_sell_value = sum(t.price * t.quantity for t in sells)
    realized_pnl = sum(t.gain_loss for t in matched_sells)  # type: ignore[arg-type]

    if matched_sells:
        wins = sum(1 for t in matched_sells if t.gain_loss > 0)  # type: ignore[operator]
        win_rate = wins / len(matched_sells)
    else:
        win_rate = 0.0

    days_values = [t.holding_days for t in matched_sells if t.holding_days is not None]
    avg_holding_days = sum(days_values) / len(days_values) if days_values else None

    symbol_buy_value: dict[str, float] = {}
    for t in buys:
        symbol_buy_value[t.symbol] = symbol_buy_value.get(t.symbol, 0.0) + t.price * t.quantity

    if symbol_buy_value and total_buy_value > 0:
        top_symbol = max(symbol_buy_value, key=lambda s: symbol_buy_value[s])
        top_symbol_pct = symbol_buy_value[top_symbol] / total_buy_value
    else:
        top_symbol = None
        top_symbol_pct = None

    return PortfolioMetrics(
        total_buy_value=round(total_buy_value, 2),
        total_sell_value=round(total_sell_value, 2),
        realized_pnl=round(realized_pnl, 4),
        win_rate=round(win_rate, 4),
        avg_holding_days=round(avg_holding_days, 1) if avg_holding_days is not None else None,
        total_trades=len(transactions),
        unique_symbols=len({t.symbol for t in transactions}),
        top_symbol=top_symbol,
        top_symbol_pct=round(top_symbol_pct, 4) if top_symbol_pct is not None else None,
    )


def _check_panic_selling(
    transactions: list[NormalizedTransaction],
    flags: list[BehaviorFlag],
) -> None:
    matched_sells = [
        t for t in transactions
        if t.transaction_type == TransactionType.SELL and t.gain_loss is not None
    ]
    if not matched_sells:
        return

    short_term_losses = [
        t for t in matched_sells
        if t.holding_days is not None and t.holding_days < 30 and t.gain_loss < 0  # type: ignore[operator]
    ]
    if not short_term_losses:
        return

    pct = len(short_term_losses) / len(matched_sells)
    has_very_short = any(t.holding_days < 7 for t in short_term_losses)  # type: ignore[operator]

    if pct > 0.30:
        severity: Severity = "high"
    elif has_very_short:
        severity = "medium"
    else:
        return

    evidence = [
        f"{len(short_term_losses)} of {len(matched_sells)} matched sells "
        f"({pct:.0%}) were losses within 30 days of buying."
    ]
    worst = sorted(short_term_losses, key=lambda t: t.gain_loss)[:3]  # type: ignore[arg-type]
    for t in worst:
        evidence.append(
            f"{t.symbol} sold after {t.holding_days}d — loss ₹{abs(t.gain_loss):,.2f}"  # type: ignore[arg-type]
        )

    flags.append(BehaviorFlag(
        name="panic_selling",
        severity=severity,
        title="Panic Selling Detected",
        description="You are selling positions at a loss within a short holding window.",
        evidence=evidence,
    ))


def _check_overtrading(
    transactions: list[NormalizedTransaction],
    flags: list[BehaviorFlag],
) -> None:
    days_values = [
        t.holding_days for t in transactions
        if t.transaction_type == TransactionType.SELL and t.holding_days is not None
    ]
    if not days_values:
        return

    avg = sum(days_values) / len(days_values)
    if avg >= 90:
        return

    severity: Severity = "high" if avg < 30 else "medium"
    flags.append(BehaviorFlag(
        name="overtrading",
        severity=severity,
        title="Overtrading Pattern",
        description="Your average holding period is too short to reflect long-term investing.",
        evidence=[
            f"Average holding period across {len(days_values)} matched sells: {avg:.1f} days.",
            "Long-term investors typically hold positions for 1 year or more.",
        ],
    ))


def _check_concentration_risk(
    transactions: list[NormalizedTransaction],
    flags: list[BehaviorFlag],
) -> None:
    buys = [t for t in transactions if t.transaction_type == TransactionType.BUY]
    if not buys:
        return

    total_buy_value = sum(t.price * t.quantity for t in buys)
    if total_buy_value == 0:
        return

    symbol_value: dict[str, float] = {}
    for t in buys:
        symbol_value[t.symbol] = symbol_value.get(t.symbol, 0.0) + t.price * t.quantity

    worst_symbol = max(symbol_value, key=lambda s: symbol_value[s])
    worst_pct = symbol_value[worst_symbol] / total_buy_value

    if worst_pct < 0.40:
        return

    severity: Severity = "high" if worst_pct > 0.60 else "medium"
    flags.append(BehaviorFlag(
        name="concentration_risk",
        severity=severity,
        title="Concentration Risk",
        description="A disproportionate share of your capital is invested in a single stock.",
        evidence=[
            f"{worst_symbol} accounts for {worst_pct:.0%} of total buy value "
            f"(₹{symbol_value[worst_symbol]:,.2f} of ₹{total_buy_value:,.2f}).",
            "Spreading across 8–10 positions reduces your exposure to any single company.",
        ],
    ))


def _check_loss_rate(
    transactions: list[NormalizedTransaction],
    flags: list[BehaviorFlag],
) -> None:
    matched_sells = [
        t for t in transactions
        if t.transaction_type == TransactionType.SELL and t.gain_loss is not None
    ]
    if not matched_sells:
        return

    wins = sum(1 for t in matched_sells if t.gain_loss > 0)  # type: ignore[operator]
    win_rate = wins / len(matched_sells)
    if win_rate >= 0.40:
        return

    flags.append(BehaviorFlag(
        name="loss_rate",
        severity="medium",
        title="High Loss Rate",
        description="More than 60% of your closed trades resulted in a loss.",
        evidence=[
            f"{wins} winning trades out of {len(matched_sells)} total ({win_rate:.0%} win rate).",
            f"{len(matched_sells) - wins} trades closed at a loss.",
        ],
    ))


def _build_suggestions(
    flags: list[BehaviorFlag],
    metrics: PortfolioMetrics,
) -> list[str]:
    suggestions: list[str] = []
    flag_names = {f.name for f in flags}

    if "panic_selling" in flag_names and len(suggestions) < 3:
        suggestions.append(
            "Consider setting a stop-loss rule before entering a position, "
            "not after prices have already fallen."
        )

    if "overtrading" in flag_names and len(suggestions) < 3:
        avg = metrics.avg_holding_days
        days_str = f"{avg:.0f} days" if avg is not None else "a very short period"
        suggestions.append(
            f"Your average hold time is {days_str}. Long-term investors "
            "typically hold positions for 1 year or more to benefit from compounding."
        )

    if "concentration_risk" in flag_names and len(suggestions) < 3:
        symbol = metrics.top_symbol or "one stock"
        pct_str = f"{metrics.top_symbol_pct:.0%}" if metrics.top_symbol_pct is not None else "A large portion"
        suggestions.append(
            f"{pct_str} of your buy capital is in {symbol}. "
            "Spreading across 8–10 positions reduces your exposure to any single company."
        )

    if "loss_rate" in flag_names and len(suggestions) < 3:
        suggestions.append(
            "Review your entry criteria — most of your closed positions resulted in a loss. "
            "Consider defining a minimum risk/reward ratio before each trade."
        )

    return suggestions
