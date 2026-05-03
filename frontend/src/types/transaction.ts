export type TransactionType = "buy" | "sell";

export interface NormalizedTransaction {
  symbol: string;
  transaction_type: TransactionType;
  price: number;
  quantity: number;
  date: string;
  exchange: string | null;
  segment: string | null;
  buy_price: number | null;
  sell_price: number | null;
  gain_loss: number | null;
  holding_days: number | null;
  source: "csv" | "manual";
}

export interface IngestResponse {
  transactions: NormalizedTransaction[];
  row_count: number;
  warnings: string[];
  errors: string[];
}

export interface ManualEntryPayload {
  symbol: string;
  type: TransactionType;
  price: number;
  quantity: number;
  date: string;
  buy_price?: number | null;
  sell_price?: number | null;
}
