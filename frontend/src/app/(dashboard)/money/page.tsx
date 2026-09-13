import { requireAuth } from "@/lib/session";
import {
  getMoneySummaryApi,
  getFinancialHistoryApi,
} from "@/lib/api/money";
import { MoneyClient } from "@/features/money/money-client";

export const metadata = {
  title: "Money Management — LearnTrack",
  description:
    "50/20/20/10 financial allocation, budget planning, and expense tracking.",
};

export default async function MoneyPage() {
  const { token } = await requireAuth();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [summaryRes, historyRes] = await Promise.all([
    getMoneySummaryApi(currentMonth, currentYear, token),
    getFinancialHistoryApi(token),
  ]);

  const initialSummary = summaryRes.success && summaryRes.data ? summaryRes.data : {
    budget: null,
    breakdown: { NEEDS: 0, SAVINGS: 0, GROWTH: 0, WANTS: 0 },
    spent: { NEEDS: 0, SAVINGS: 0, GROWTH: 0, WANTS: 0 },
    remaining: { NEEDS: 0, SAVINGS: 0, GROWTH: 0, WANTS: 0 },
    totalSpent: 0,
    totalRemaining: 0,
  };

  const initialFinancialHistory = historyRes.success && historyRes.data ? historyRes.data : {
    monthlyHistory: [],
    yearlyHistory: [],
    allTimeTotalIncome: 0,
    allTimeTotalSpent: 0,
    allTimeBalance: 0,
  };

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
