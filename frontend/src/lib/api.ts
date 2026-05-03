import { IngestResponse, ManualEntryPayload, NormalizedTransaction } from "@/types/transaction";
import { AnalysisResult } from "@/types/analysis";
import { SavedReport, SaveReportRequest } from "@/types/report";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.detail ?? message;
    } catch {}
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

export async function postCsvUpload(file: File): Promise<IngestResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/ingest/csv`, { method: "POST", body: form });
  return handleResponse<IngestResponse>(res);
}

export async function postManualEntry(payload: ManualEntryPayload): Promise<IngestResponse> {
  const res = await fetch(`${BASE}/ingest/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<IngestResponse>(res);
}

export async function postAnalyze(transactions: NormalizedTransaction[]): Promise<AnalysisResult> {
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transactions),
  });
  return handleResponse<AnalysisResult>(res);
}

export async function postInsights(result: AnalysisResult): Promise<{ insight: string }> {
  const res = await fetch(`${BASE}/insights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });
  return handleResponse<{ insight: string }>(res);
}

export async function saveReport(body: SaveReportRequest): Promise<{ id: string; url: string }> {
  const res = await fetch(`${BASE}/report/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return handleResponse<{ id: string; url: string }>(res);
}

export async function getReport(id: string): Promise<SavedReport> {
  const res = await fetch(`${BASE}/report/${id}`);
  return handleResponse<SavedReport>(res);
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/health`);
  return handleResponse(res);
}
