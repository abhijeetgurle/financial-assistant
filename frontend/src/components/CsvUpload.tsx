"use client";

import { useRef, useState, DragEvent } from "react";
import { postCsvUpload, ApiError } from "@/lib/api";
import { IngestResponse } from "@/types/transaction";
import ErrorBanner from "./ErrorBanner";

interface Props {
  onSuccess: (data: IngestResponse) => void;
}

export default function CsvUpload({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit(file: File) {
    setError(null);
    setLoading(true);
    setFileName(file.name);
    try {
      const data = await postCsvUpload(file);
      onSuccess(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) submit(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) submit(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300 hover:bg-gray-50"
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
        <svg className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        {loading ? (
          <p className="text-sm text-indigo-600 font-medium">Uploading {fileName}…</p>
        ) : fileName ? (
          <p className="text-sm text-gray-700">{fileName} — click to change</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700">Drop your Zerodha Tradebook CSV here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Download your tradebook from{" "}
        <span className="font-medium text-gray-700">console.zerodha.com → Reports → Tradebook</span>,
        then export as CSV.
      </p>

      {error && <ErrorBanner message={error} />}
    </div>
  );
}
