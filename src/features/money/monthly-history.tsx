"use client";

import { useState } from "react";
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Scale,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/lib/money/money-utils";
import type {
  MonthlyHistoryItemDTO,
  FinancialHistoryDTO,
  YearlyHistoryItemDTO,
} from "@/lib/money/money-types";

interface FinancialHistoryProps {
  history: MonthlyHistoryItemDTO[];
  financialHistory?: FinancialHistoryDTO;
  selectedYear: number;
  selectedMonth: number;
  onSelectMonth: (year: number, month: number) => void;
}

export function MonthlyHistoryList({
  history,
  financialHistory,
  selectedYear,
  selectedMonth,
  onSelectMonth,
}: FinancialHistoryProps) {
  const [activeTab, setActiveTab] = useState<"monthly" | "yearly">("monthly");
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  // Derive yearly history and grand total if not explicitly provided
  const yearlyData: YearlyHistoryItemDTO[] = (() => {
    if (financialHistory && financialHistory.yearlyHistory.length > 0) {
      return financialHistory.yearlyHistory;
    }

    const yearMap = new Map<number, MonthlyHistoryItemDTO[]>();
    for (const m of history) {
      const list = yearMap.get(m.year) || [];
      list.push(m);
      yearMap.set(m.year, list);
    }

    const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);
    return sortedYears.map((year) => {
      const months = yearMap.get(year) || [];
      const totalIncome = months.reduce((sum, m) => sum + m.amount, 0);
      const totalSpent = months.reduce((sum, m) => sum + m.totalSpent, 0);
      const netBalance = Number((totalIncome - totalSpent).toFixed(2));
      return {
        year,
        totalIncome,
        totalSpent,
        netBalance,
        isOverBudget: netBalance < 0,
        monthsCount: months.length,
        months,
      };
    });
  })();

  const grandTotal = (() => {
    if (financialHistory?.grandTotal) {
      return financialHistory.grandTotal;
    }
    const totalIncome = history.reduce((sum, m) => sum + m.amount, 0);
    const totalSpent = history.reduce((sum, m) => sum + m.totalSpent, 0);
    const netBalance = Number((totalIncome - totalSpent).toFixed(2));
    return {
      totalIncome,
      totalSpent,
      netBalance,
    };
  })();

  if (history.length === 0) {
    return (
      <div className="py-8 px-4 text-center border border-dashed rounded-xl bg-muted/10 text-xs text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="font-semibold text-foreground">No financial history yet</p>
        <p className="mt-0.5">
          Budgets and money records entered for past and upcoming dates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Grand Total Summary Banner */}
      <div className="p-3.5 rounded-xl border bg-gradient-to-br from-card via-card to-primary/5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Lifetime Financial Overview</span>
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {history.length} Month{history.length === 1 ? "" : "s"} Recorded
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/60">
          <div>
            <span className="text-[10px] text-muted-foreground block">
              Total Income
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
              {formatMoney(grandTotal.totalIncome)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">
              Total Spent
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-amber-600">
              {formatMoney(grandTotal.totalSpent)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground block">
              Net Balance
            </span>
            <span
              className={`text-xs sm:text-sm font-bold font-mono ${
                grandTotal.netBalance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              }`}
            >
              {formatMoney(grandTotal.netBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Mode Tabs: Monthly vs Yearly */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("monthly")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === "monthly"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Monthly History</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("yearly")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
            activeTab === "yearly"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>Yearly History</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "monthly" ? (
        /* Monthly Breakdown List */
        <div className="space-y-2">
          {history.map((item) => {
            const isSelected =
              item.year === selectedYear && item.month === selectedMonth;
            const balance = item.totalRemaining;
            const isOver = item.isOverBudget;

            return (
              <button
                key={item.budgetId}
                type="button"
                onClick={() => onSelectMonth(item.year, item.month)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary ring-1 ring-primary shadow-xs"
                    : "bg-card/70 hover:bg-card hover:border-border border-border/70"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {item.monthName}
                    </span>
                    {isOver ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/15 text-destructive">
                        Deficit
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Surplus
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                    <span>
                      Income:{" "}
                      <strong className="text-foreground">
                        {formatMoney(item.amount)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Spent:{" "}
                      <strong className="text-amber-600">
                        {formatMoney(item.totalSpent)}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Balance:{" "}
                      <strong
                        className={
                          isOver
                            ? "text-destructive"
                            : "text-emerald-600 dark:text-emerald-400"
                        }
                      >
                        {formatMoney(balance)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <ChevronRight
                    className={`h-4 w-4 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Yearly Breakdown Cards */
        <div className="space-y-3">
          {yearlyData.map((y) => {
            const isExpanded = expandedYears[y.year] ?? true;

            return (
              <div
                key={y.year}
                className="rounded-xl border bg-card/80 shadow-2xs overflow-hidden"
              >
                {/* Year Header Summary */}
                <button
                  type="button"
                  onClick={() => toggleYear(y.year)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-muted/30 transition-all text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-foreground tracking-tight">
                        {y.year}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {y.monthsCount} month{y.monthsCount === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-muted-foreground">
                        Income:{" "}
                        <strong className="text-foreground">
                          {formatMoney(y.totalIncome)}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Spent:{" "}
                        <strong className="text-amber-600">
                          {formatMoney(y.totalSpent)}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Balance:{" "}
                        <strong
                          className={
                            y.isOverBudget
                              ? "text-destructive"
                              : "text-emerald-600 dark:text-emerald-400"
                          }
                        >
                          {formatMoney(y.netBalance)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {/* Nested Months in Year */}
                {isExpanded && (
                  <div className="p-2.5 pt-0 space-y-1.5 border-t border-border/40 bg-muted/10">
                    {y.months.map((m) => {
                      const isSelected =
                        m.year === selectedYear && m.month === selectedMonth;

                      return (
                        <button
                          key={m.budgetId}
                          type="button"
                          onClick={() => onSelectMonth(m.year, m.month)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all ${
                            isSelected
                              ? "bg-primary/15 border border-primary/40 font-bold"
                              : "hover:bg-card/90 bg-card/40 border border-border/40"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {m.monthName}
                            </span>
                            {m.isOverBudget ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-destructive/15 text-destructive">
                                Over
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                Surplus
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-muted-foreground">
                              {formatMoney(m.amount)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span
                              className={
                                m.isOverBudget
                                  ? "text-destructive font-semibold"
                                  : "text-emerald-600 dark:text-emerald-400 font-semibold"
                              }
                            >
                              {formatMoney(m.totalRemaining)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
