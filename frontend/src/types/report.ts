import { AnalysisResult } from "./analysis";

export interface SavedReport {
  id: string;
  result: AnalysisResult;
  insight: string | null;
  created_at: string; // ISO-8601 UTC
}

export interface SaveReportRequest {
  result: AnalysisResult;
  insight?: string | null;
}
