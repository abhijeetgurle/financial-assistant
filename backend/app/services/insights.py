import os

import anthropic

from app.models.analysis import AnalysisResult

SYSTEM_PROMPT = (
    "You are a behavioral finance coach helping Indian retail investors understand "
    "their trading psychology. Given a structured analysis of their trading history, "
    "write 2-3 short paragraphs (150-220 words total) that:\n"
    "- Open with a direct observation about their dominant behavior pattern\n"
    "- Name the psychological driver (loss aversion, FOMO, recency bias, etc.)\n"
    "- End with one concrete mental framework or rule they can apply next time\n\n"
    "Tone: empathetic, direct, non-judgmental. "
    "Do NOT give buy/sell advice or name specific stocks. "
    "Use Indian market context (Nifty, Sensex, SIP) where it feels natural."
)


def generate_insight(result: AnalysisResult) -> str:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not configured")

    client = anthropic.Anthropic(api_key=key)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=400,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": _format_context(result)}],
    )
    return message.content[0].text  # type: ignore[union-attr]


def _format_context(result: AnalysisResult) -> str:
    m = result.metrics
    lines = [
        f"Realized P&L: ₹{m.realized_pnl:,.2f}",
        f"Win rate: {m.win_rate:.0%} ({m.total_trades} trades, {m.unique_symbols} symbols)",
        (
            f"Avg holding period: {m.avg_holding_days:.1f} days"
            if m.avg_holding_days is not None
            else "Avg holding period: N/A"
        ),
        (
            f"Top symbol allocation: {m.top_symbol} at {m.top_symbol_pct:.0%}"
            if m.top_symbol and m.top_symbol_pct is not None
            else ""
        ),
        "",
        "Behavior flags detected:",
    ]
    if result.flags:
        for f in result.flags:
            lines.append(f"  [{f.severity.upper()}] {f.title}: {f.description}")
            for e in f.evidence:
                lines.append(f"    · {e}")
    else:
        lines.append("  None — healthy trading patterns.")
    return "\n".join(line for line in lines if line is not None)
