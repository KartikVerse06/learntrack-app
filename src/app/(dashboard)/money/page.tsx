import { requireAuth } from "@/lib/session";
import {
  getMoneySummary,
  getFinancialHistory,
} from "@/server/repositories/money-repository";
import { MoneyClient } from "@/features/money/money-client";

export const metadata = {
  title: "Money Management — LearnTrack",
  description:
    "50/20/20/10 financial allocation, budget planning, and expense tracking.",
};

export default async function MoneyPage() {
  const { userId } = await requireAuth();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [initialSummary, initialFinancialHistory] = await Promise.all([
    getMoneySummary(userId, currentYear, currentMonth),
    getFinancialHistory(userId),
  ]);

  return (
    <MoneyClient
      initialSummary={initialSummary}
      initialHistory={initialFinancialHistory.monthlyHistory}
      initialFinancialHistory={initialFinancialHistory}
      initialYear={currentYear}
      initialMonth={currentMonth}
    />
  );
}
