"use client";

import { AnalysisResult, BehaviorFlag } from "@/types/analysis";

interface Props {
  result: AnalysisResult;
  insight?: string | null; // undefined = unavailable/error; null = loading
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold truncate ${valueColor ?? "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

const SEVERITY_CARD: Record<string, string> = {
  high:   "border-red-300    bg-red-50    text-red-900",
  medium: "border-yellow-300 bg-yellow-50 text-yellow-900",
  low:    "border-blue-300   bg-blue-50   text-blue-900",
};
const SEVERITY_BADGE: Record<string, string> = {
  high:   "bg-red-100    text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low:    "bg-blue-100   text-blue-700",
};

function FlagCard({ flag }: { flag: BehaviorFlag }) {
  return (
    <div className={`rounded-lg border p-4 ${SEVERITY_CARD[flag.severity] ?? SEVERITY_CARD.low}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm">{flag.title}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${SEVERITY_BADGE[flag.severity] ?? SEVERITY_BADGE.low}`}>
          {flag.severity}
        </span>
      </div>
      <p className="mt-1 text-xs opacity-75">{flag.description}</p>
      {flag.evidence.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {flag.evidence.map((e, i) => (
            <li key={i} className="text-xs opacity-70">· {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmtINR(v: number): string {
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  return `₹${formatted}`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export default function AnalysisReport({ result, insight }: Props) {
  const { flags, metrics, suggestions } = result;

  const pnlPositive = metrics.realized_pnl > 0;
  const pnlNegative = metrics.realized_pnl < 0;
  const pnlColor = pnlPositive ? "text-green-600" : pnlNegative ? "text-red-600" : "text-gray-900";
  const pnlPrefix = pnlPositive ? "+" : pnlNegative ? "-" : "";

  return (
    <div className="space-y-8">
      {/* AI Insight */}
      {insight !== undefined && (
        <section>
          <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            AI Insight
          </h2>
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
            {insight === null ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 bg-violet-200 rounded w-full" />
                <div className="h-3 bg-violet-200 rounded w-5/6" />
                <div className="h-3 bg-violet-200 rounded w-4/6" />
              </div>
            ) : (
              <>
                <p className="text-sm text-violet-900 whitespace-pre-line leading-relaxed">{insight}</p>
                <p className="mt-3 text-xs text-violet-400">Powered by Claude</p>
              </>
            )}
          </div>
        </section>
      )}

      {/* Portfolio Summary */}
      <section>
        <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Portfolio Summary
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Realized P&L"
            value={`${pnlPrefix}${fmtINR(metrics.realized_pnl)}`}
            sub={`${metrics.total_trades} total trades`}
            valueColor={pnlColor}
          />
          <StatCard
            label="Win Rate"
            value={fmtPct(metrics.win_rate)}
            sub={`${metrics.unique_symbols} symbol${metrics.unique_symbols !== 1 ? "s" : ""} traded`}
          />
          <StatCard
            label="Avg Hold Time"
            value={metrics.avg_holding_days !== null ? `${Math.round(metrics.avg_holding_days)}d` : "—"}
            sub="across matched sells"
          />
          <StatCard
            label="Top Holding"
            value={metrics.top_symbol ?? "—"}
            sub={metrics.top_symbol_pct !== null ? `${fmtPct(metrics.top_symbol_pct)} of buys` : undefined}
          />
        </div>
      </section>

      {/* Behavior Flags */}
      <section>
        <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Behavior Flags
        </h2>
        {flags.length === 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800 font-medium">No behavioral flags detected.</p>
            <p className="text-xs text-green-700 mt-0.5 opacity-80">Your trading patterns look healthy based on the uploaded data.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {flags.map((f) => (
              <FlagCard key={f.name} flag={f} />
            ))}
          </div>
        )}
      </section>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Suggestions
          </h2>
          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-800">
                  {i + 1}
                </span>
                <p className="text-sm text-indigo-900">{s}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
