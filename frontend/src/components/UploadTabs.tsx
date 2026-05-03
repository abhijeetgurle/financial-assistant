"use client";

import { useState } from "react";
import CsvUpload from "./CsvUpload";
import ManualEntryForm from "./ManualEntryForm";
import TransactionTable from "./TransactionTable";
import { IngestResponse } from "@/types/transaction";

type Tab = "csv" | "manual";

export default function UploadTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("csv");
  const [result, setResult] = useState<IngestResponse | null>(null);

  function handleSuccess(data: IngestResponse) {
    setResult(data);
  }

  function handleContinue() {
    // Phase 2: navigate to analysis page with the transaction data
    if (result) {
      sessionStorage.setItem("transactions", JSON.stringify(result));
      window.location.href = "/analysis";
    }
  }

  return (
    <div className="space-y-6">
      {!result ? (
        <>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {(["csv", "manual"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "csv" ? "Upload Zerodha CSV" : "Manual Entry"}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "csv" ? (
              <CsvUpload onSuccess={handleSuccess} />
            ) : (
              <ManualEntryForm onSuccess={handleSuccess} />
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <TransactionTable data={result} onContinue={handleContinue} />
          <button
            onClick={() => setResult(null)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            ← Upload different file
          </button>
        </div>
      )}
    </div>
  );
}
