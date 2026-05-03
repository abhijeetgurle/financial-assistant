"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IngestResponse } from "@/types/transaction";
import { AnalysisResult } from "@/types/analysis";
import { postAnalyze, postInsights, ApiError } from "@/lib/api";
import AnalysisReport from "@/components/AnalysisReport";

type Status = "loading" | "success" | "error";
type InsightStatus = "loading" | "ready" | "unavailable";

export default function AnalysisPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightStatus, setInsightStatus] = useState<InsightStatus>("loading");

  useEffect(() => {
    const raw = sessionStorage.getItem("transactions");
    if (!raw) {
      router.replace("/upload");
      return;
    }

    let parsed: IngestResponse;
    try {
      parsed = JSON.parse(raw) as IngestResponse;
    } catch {
      router.replace("/upload");
      return;
    }

    postAnalyze(parsed.transactions)
      .then((data) => {
        setResult(data);
        setStatus("success");
        postInsights(data)
          .then((r) => {
            setInsight(r.insight);
            setInsightStatus("ready");
          })
          .catch(() => setInsightStatus("unavailable"));
      })
      .catch((e) => {
        setErrorMsg(e instanceof ApiError ? e.message : "Analysis failed. Please try again.");
        setStatus("error");
      });
  }, [router]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500 animate-pulse">Analyzing your portfolio…</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-600">{errorMsg}</p>
          <a href="/upload" className="text-sm text-indigo-600 underline hover:text-indigo-500">
            ← Back to upload
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Behavior Analysis</h1>
            <p className="mt-1 text-sm text-gray-500">
              Based on your uploaded transactions — not financial advice.
            </p>
          </div>
          <a
            href="/upload"
            className="shrink-0 text-sm text-indigo-600 hover:text-indigo-500 underline"
          >
            ← Back
          </a>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          {result && (
            <AnalysisReport
              result={result}
              insight={insightStatus === "unavailable" ? undefined : insight}
            />
          )}
        </div>
      </div>
    </main>
  );
}
