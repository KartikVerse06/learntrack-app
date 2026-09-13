import { ReportType } from "./report-types";

export interface JsonReportEnvelope {
  schema: string;
  exportVersion: string;
  system: string;
  reportType: ReportType;
  generatedAt: string;
  user: {
    name: string;
    email: string;
  };
  period: {
    from?: string;
    to?: string;
    label: string;
  };
  data: unknown;
}

/**
 * Universal JSON dispatcher for LearnTrack reports.
 * Wraps report data in a consistent, machine-readable envelope with schema versioning.
 */
export function generateJsonForReport(type: ReportType, rawData: any): string {
  const metadata = rawData?.metadata || {};
  const envelope: JsonReportEnvelope = {
    schema: "https://learntrack.app/schemas/report-v1.json",
    exportVersion: "1.0",
    system: "LearnTrack Deliberate Learning & Spaced Revision System",
    reportType: type,
    generatedAt: metadata.generatedAt || new Date().toISOString(),
    user: {
      name: metadata.user?.name || "Learner",
      email: metadata.user?.email || "learner@learntrack.local",
    },
    period: {
      from: metadata.from,
      to: metadata.to,
      label: metadata.periodLabel || "All Time",
    },
    data: rawData,
  };

  return JSON.stringify(envelope, null, 2);
}
