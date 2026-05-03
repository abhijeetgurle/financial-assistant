export type Severity = "high" | "medium" | "low";

export interface BehaviorFlag {
  name: string;
  severity: Severity;
  title: string;
  description: string;
  evidence: string[];
}

export interface PortfolioMetrics {
  total_buy_value: number;
  total_sell_value: number;
  realized_pnl: number;
  win_rate: number;              // fraction 0.0–1.0
  avg_holding_days: number | null;
  total_trades: number;
  unique_symbols: number;
  top_symbol: string | null;
  top_symbol_pct: number | null; // fraction 0.0–1.0
}

export interface AnalysisResult {
  flags: BehaviorFlag[];
  metrics: PortfolioMetrics;
  suggestions: string[];
}
