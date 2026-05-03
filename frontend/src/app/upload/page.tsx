import UploadTabs from "@/components/UploadTabs";

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Financial Behavior Assistant</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload your Zerodha tradebook to understand your investing behavior.
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
          <UploadTabs />
        </div>
      </div>
    </main>
  );
}
