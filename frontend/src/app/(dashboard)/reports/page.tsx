import { Metadata } from "next";
import { requireAuth } from "@/lib/session";
import { getReportOverviewStatsApi } from "@/lib/api/reports";
import { ReportsClient } from "@/features/reports/reports-client";

export const metadata: Metadata = {
  title: "Reports & Exports | LearnTrack",
  description:
    "Generate and download comprehensive, printable records of your learning progress, focus sessions, retention revisions, and personal analytics.",
};

export default async function ReportsPage() {
  const { user, token } = await requireAuth();

  const statsResult = await getReportOverviewStatsApi("30d", undefined, undefined, token);
  const stats = statsResult.success ? statsResult.data : null;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      <ReportsClient
        initialStats={stats}
        userName={user.name || "Learner"}
        userEmail={user.email || "learner@learntrack.local"}
      />
    </div>
  );
}
