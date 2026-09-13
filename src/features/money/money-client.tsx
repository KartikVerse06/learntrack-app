"use client";

import { useState, useTransition } from "react";
import {
  setMonthlyBudgetAction,
  createExpenseAction,
  deleteExpenseAction,
  getMoneySummaryAction,
  getMonthlyHistoryAction,
  getFinancialHistoryAction,
} from "@/server/actions/money-actions";
import { MoneySummaryView } from "./money-summary";
import { MoneyAllocationView } from "./money-allocation";
import { ExpenseList } from "./expense-list";
import { ExpenseFormDialog } from "./expense-form";
import { MonthlyHistoryList } from "./monthly-history";
import { MoneyEmptyBudget } from "./money-empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Receipt, History, Plus, Loader2, CalendarIcon, CheckCircle2, FileText } from "lucide-react";
import { getMonthName } from "@/lib/money/money-utils";
import type {
  MoneyCategory,
  MoneySummaryDTO,
  MonthlyHistoryItemDTO,
  FinancialHistoryDTO,
} from "@/lib/money/money-types";

interface MoneyClientProps {
  initialSummary: MoneySummaryDTO;
  initialHistory: MonthlyHistoryItemDTO[];
  initialFinancialHistory?: FinancialHistoryDTO;
  initialYear: number;
  initialMonth: number;
}

export function MoneyClient({
  initialSummary,
  initialHistory,
  initialFinancialHistory,
  initialYear,
  initialMonth,
}: MoneyClientProps) {
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [summary, setSummary] = useState<MoneySummaryDTO>(initialSummary);
  const [history, setHistory] = useState<MonthlyHistoryItemDTO[]>(initialHistory);
  const [financialHistory, setFinancialHistory] = useState<
    FinancialHistoryDTO | undefined
  >(initialFinancialHistory);

  const [isPending, startTransition] = useTransition();
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  // Switch month directly or via history
  const handleSelectMonth = async (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);

    // Keep date picker in sync with selected month
    const mStr = String(month).padStart(2, "0");
    setSelectedDate(`${year}-${mStr}-01`);

    startTransition(async () => {
      const res = await getMoneySummaryAction(year, month);
      if (res.success) {
        setSummary(res.data);
      }
    });
  };

  // Handle date change from the date picker
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const parts = newDate.split("-").map(Number);
    if (parts.length >= 2) {
      const [y, m] = parts;
      if (y && m && (y !== selectedYear || m !== selectedMonth)) {
        setSelectedYear(y);
        setSelectedMonth(m);
        startTransition(async () => {
          const res = await getMoneySummaryAction(y, m);
          if (res.success) {
            setSummary(res.data);
          }
        });
      }
    }
  };

  // Refresh data helper
  const refreshData = async (targetYear: number, targetMonth: number) => {
    const [newSummary, newFinancial] = await Promise.all([
      getMoneySummaryAction(targetYear, targetMonth),
      getFinancialHistoryAction(),
    ]);

    if (newSummary.success) setSummary(newSummary.data);
    if (newFinancial.success) {
      setFinancialHistory(newFinancial.data);
      setHistory(newFinancial.data.monthlyHistory);
    }
  };

  // Set / update budget with auto-save support
  const handleSetBudget = async (
    amount: number,
    year?: number,
    month?: number
  ) => {
    const targetYear = year ?? selectedYear;
    const targetMonth = month ?? selectedMonth;

    const res = await setMonthlyBudgetAction({
      amount,
      year: targetYear,
      month: targetMonth,
    });

    if (res.success) {
      await refreshData(targetYear, targetMonth);
      return { success: true };
    }

    return {
      success: false,
      error: res.error ? res.error.message : "Failed to save monthly budget.",
    };
  };

  // Add expense
  const handleAddExpense = async (input: {
    budgetId: string;
    category: MoneyCategory;
    amount: number;
    date: string;
    note?: string | null;
  }) => {
    const res = await createExpenseAction(input);

    if (res.success) {
      await refreshData(selectedYear, selectedMonth);
      return { success: true };
    }

    return {
      success: false,
      error: res.error ? res.error.message : "Failed to add expense.",
    };
  };

  // Delete expense
  const handleDeleteExpense = async (expenseId: string) => {
    const res = await deleteExpenseAction(expenseId);

    if (res.success) {
      await refreshData(selectedYear, selectedMonth);
      return { success: true };
    }

    return {
      success: false,
      error: res.error ? res.error.message : "Failed to delete expense.",
    };
  };

  const currentMonthTitle = `${getMonthName(selectedMonth)} ${selectedYear}`;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Money Management
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Balanced 50 / 20 / 20 / 10 financial allocation & expense tracking for deliberate learners.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-1.5 shadow-sm text-xs h-9 hidden sm:inline-flex"
            title="Download Financial Reports"
          >
            <Link href="/reports">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span>Export Report</span>
            </Link>
          </Button>

          {summary.budget && (
            <ExpenseFormDialog
              budgetId={summary.budget.id}
              onAddExpense={handleAddExpense}
              isOpen={isExpenseDialogOpen}
              onOpenChange={setIsExpenseDialogOpen}
              triggerButton={
                <Button size="sm" className="gap-2 shadow-sm shrink-0">
                  <Plus className="h-4 w-4" />
                  <span>Add Expense</span>
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Loading state indicator during month switch */}
      {isPending && (
        <div className="flex items-center gap-2 text-xs text-primary font-medium p-2 rounded-lg bg-primary/10">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Updating workspace for {currentMonthTitle}...</span>
        </div>
      )}

      {/* 1. Monthly Amount Input & Metric Cards with Date & Auto-Save */}
      <MoneySummaryView
        summary={summary}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onSetBudget={handleSetBudget}
        onOpenAddExpense={() => setIsExpenseDialogOpen(true)}
      />

      {/* 2. 50/20/20/10 Category Allocation or Empty State */}
      {summary.budget && summary.allocation ? (
        <MoneyAllocationView
          allocation={summary.allocation}
          categoryBreakdown={summary.categoryBreakdown}
        />
      ) : (
        <MoneyEmptyBudget />
      )}

      {/* 3. Expenses & Financial History: Responsive 2-column on desktop, stacked on mobile */}
      {summary.budget && (
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Recent Expenses (4/7) */}
          <Card className="lg:col-span-4 shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  <span>Recent Expenses</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Spending recorded for {currentMonthTitle}
                </CardDescription>
              </div>

              <ExpenseFormDialog
                budgetId={summary.budget.id}
                onAddExpense={handleAddExpense}
                triggerButton={
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </Button>
                }
              />
            </CardHeader>
            <CardContent>
              <ExpenseList
                expenses={summary.recentExpenses}
                onDeleteExpense={handleDeleteExpense}
                onAddExpense={() => setIsExpenseDialogOpen(true)}
              />
            </CardContent>
          </Card>

          {/* Financial History (Monthly & Yearly) (3/7) */}
          <Card className="lg:col-span-3 shadow-sm border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                <span>Financial History</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Complete monthly and yearly income, spending, and balance records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyHistoryList
                history={history}
                financialHistory={financialHistory}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onSelectMonth={handleSelectMonth}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
