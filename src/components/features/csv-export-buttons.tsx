"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getResultsCsv, getRawDataCsv } from "@/lib/actions/result";

interface CsvExportButtonsProps {
  eventId: string;
  eventSlug: string | null;
  adminToken: string;
}

export function CsvExportButtons({
  eventId,
  eventSlug,
  adminToken,
}: CsvExportButtonsProps) {
  const t = useTranslations("results.export");
  const tCommon = useTranslations("common");
  const [isExportingResults, setIsExportingResults] = useState(false);
  const [isExportingRaw, setIsExportingRaw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventIdentifier = eventSlug ?? eventId;

  const downloadCsv = (content: string, filename: string) => {
    // BOMを追加してExcelで文字化けしないようにする
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportResults = async () => {
    setIsExportingResults(true);
    setError(null);

    try {
      const result = await getResultsCsv(eventIdentifier);
      if (typeof result === "string") {
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadCsv(result, `results_${eventIdentifier}_${timestamp}.csv`);
      } else {
        setError(result.error);
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setIsExportingResults(false);
    }
  };

  const handleExportRaw = async () => {
    setIsExportingRaw(true);
    setError(null);

    try {
      const result = await getRawDataCsv(eventIdentifier, adminToken);
      if (typeof result === "string") {
        const timestamp = new Date().toISOString().slice(0, 10);
        downloadCsv(result, `raw_data_${eventIdentifier}_${timestamp}.csv`);
      } else {
        setError(result.error);
      }
    } catch {
      setError(tCommon("error"));
    } finally {
      setIsExportingRaw(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          onClick={handleExportResults}
          disabled={isExportingResults}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {isExportingResults ? tCommon("loading") : t("summary")}
        </Button>

        <Button
          onClick={handleExportRaw}
          disabled={isExportingRaw}
          variant="outline"
          className="flex items-center gap-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            />
          </svg>
          {isExportingRaw ? tCommon("loading") : t("raw")}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  );
}
