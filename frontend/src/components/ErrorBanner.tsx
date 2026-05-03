"use client";

interface Props {
  message: string | string[];
}

export default function ErrorBanner({ message }: Props) {
  const messages = Array.isArray(message) ? message : [message];
  if (messages.length === 0) return null;

  return (
    <div className="rounded-md bg-red-50 border border-red-200 p-4">
      {messages.map((m, i) => (
        <p key={i} className="text-sm text-red-700">
          {m}
        </p>
      ))}
    </div>
  );
}
