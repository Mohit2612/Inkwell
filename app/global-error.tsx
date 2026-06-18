"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#FFFBF6] p-6 font-sans">
        <div className="max-w-sm text-center">
          <div className="text-4xl">✦</div>
          <h1 className="mt-4 text-xl font-bold text-[#1C1412]">Something went wrong</h1>
          <p className="mt-2 text-sm text-[#6B5F58]">
            An unexpected error occurred. Our team has been notified.
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-[#9C8F88]">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
