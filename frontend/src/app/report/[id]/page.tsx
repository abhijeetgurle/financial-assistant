"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReport, ApiError } from "@/lib/api";
import { SavedReport } from "@/types/report";
import AnalysisReport from "@/components/AnalysisReport";

export default function SharedReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<SavedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReport(id)
      .then(setReport)
      .catch((e) => {
        setError(
          e instanceof ApiError && e.status === 404
            ? "This report link has expired or does not exist."
            : "Failed to load report. Please try again."
        );
      });
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-red-600">{error}</p>
          <a href="/upload" className="text-sm text-indigo-600 underline hover:text-indigo-500">
            Analyze your own portfolio →
          </a>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500 animate-pulse">Loading report…</p>
      </main>
    );
  }

  const createdDate = new Date(report.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Behavioral Finance Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generated on {createdDate} — not financial advice.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <AnalysisReport
            result={report.result}
            insight={report.insight ?? undefined}
          />
        </div>

        <p className="no-print mt-6 text-center text-xs text-gray-400">
          Want to analyze your own portfolio?{" "}
          <a href="/upload" className="text-indigo-500 underline hover:text-indigo-600">
            Upload your Zerodha tradebook →
          </a>
        </p>
      </div>
    </main>
  );
}
