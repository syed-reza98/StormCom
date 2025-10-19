"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorBoundary({ error }: { error: Error }) {
  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="p-6 text-center text-red-600">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <pre className="bg-red-100 rounded p-2 text-sm">{error.message}</pre>
      <p className="mt-2">Our team has been notified.</p>
    </div>
  );
}
