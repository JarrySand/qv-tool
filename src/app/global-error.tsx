"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-gray-50">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <svg
              className="mx-auto h-24 w-24 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="mt-6 text-4xl font-bold text-gray-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              A critical error occurred
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="rounded-md bg-gray-900 px-6 py-3 text-white hover:bg-gray-800"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-900 hover:bg-gray-50"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

