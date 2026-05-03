"use client";

import { IngestResponse } from "@/types/transaction";

interface Props {
  data: IngestResponse;
  onContinue: () => void;
}

export default function TransactionTable({ data, onContinue }: Props) {
  const { transactions, warnings, errors } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{transactions.length}</span> transactions loaded
          {warnings.length > 0 && (
            <span className="ml-2 text-yellow-600">· {warnings.length} warning{warnings.length > 1 ? "s" : ""}</span>
          )}
        </p>
        <button
          onClick={onContinue}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Continue to Analysis →
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Symbol", "Type", "Date", "Price (₹)", "Qty", "Segment", "Gain/Loss (₹)", "Holding Days"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {transactions.map((tx, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{tx.symbol}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      tx.transaction_type === "buy"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.transaction_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{tx.date}</td>
                <td className="px-4 py-3 text-gray-900">{tx.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{tx.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{tx.segment ?? "—"}</td>
                <td className="px-4 py-3">
                  {tx.gain_loss !== null ? (
                    <span className={tx.gain_loss >= 0 ? "text-green-600" : "text-red-600"}>
                      {tx.gain_loss >= 0 ? "+" : ""}
                      {tx.gain_loss.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tx.holding_days !== null ? `${tx.holding_days}d` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(warnings.length > 0 || errors.length > 0) && (
        <details className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-yellow-800">
            {warnings.length + errors.length} issue{warnings.length + errors.length > 1 ? "s" : ""} detected
          </summary>
          <ul className="mt-2 space-y-1">
            {[...errors.map((e) => ({ type: "error", msg: e })), ...warnings.map((w) => ({ type: "warning", msg: w }))].map(
              ({ type, msg }, i) => (
                <li key={i} className={`text-xs ${type === "error" ? "text-red-700" : "text-yellow-700"}`}>
                  {type === "error" ? "✗" : "⚠"} {msg}
                </li>
              )
            )}
          </ul>
        </details>
      )}
    </div>
  );
}
