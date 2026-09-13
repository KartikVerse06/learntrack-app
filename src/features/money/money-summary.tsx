"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Calendar,
  Plus,
  CheckCircle2,
  Check,
} from "lucide-react";
import { formatMoney, getMonthName } from "@/lib/money/money-utils";
import type { MoneySummaryDTO } from "@/lib/money/money-types";

interface MoneySummaryProps {
  summary: MoneySummaryDTO;
  selectedMonth: number;
  selectedYear: number;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSetBudget: (
    amount: number,
    year?: number,
    month?: number
  ) => Promise<{ success: boolean; error?: string }>;
  onOpenAddExpense?: () => void;
}

export function MoneySummaryView({
  summary,
  selectedMonth,
  selectedYear,
  selectedDate,
  onDateChange,
  onSetBudget,
  onOpenAddExpense,
}: MoneySummaryProps) {
  const [amountInput, setAmountInput] = useState<string>(() => {
    return summary.budget ? String(summary.budget.amount) : "";
  });
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAmountRef = useRef<number | null>(
    summary.budget ? summary.budget.amount : null
  );

  // Sync amount when budget changes externally (e.g., month switch)
  useEffect(() => {
    const currentBudgetAmount = summary.budget ? summary.budget.amount : null;
    lastSavedAmountRef.current = currentBudgetAmount;
    setAmountInput(currentBudgetAmount !== null ? String(currentBudgetAmount) : "");
    setSaveStatus("idle");
    setErrorMessage(null);
  }, [summary.budget, selectedYear, selectedMonth]);

  const presets = [500, 1000, 3700, 5000, 12500, 50000];

  const performSave = async (numericAmount: number) => {
    if (numericAmount === lastSavedAmountRef.current) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    setErrorMessage(null);

    try {
      const res = await onSetBudget(numericAmount, selectedYear, selectedMonth);
      if (res.success) {
        lastSavedAmountRef.current = numericAmount;
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
        setErrorMessage(res.error || "Failed to save money amount.");
      }
    } catch {
      setSaveStatus("error");
      setErrorMessage("An unexpected error occurred while saving.");
    }
  };

  const handleAmountChange = (val: string) => {
    setAmountInput(val);
    setSaveStatus("idle");
    setErrorMessage(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const numericAmount = parseFloat(val);
    if (!isNaN(numericAmount) && numericAmount > 0) {
      setSaveStatus("saving");
      debounceTimerRef.current = setTimeout(() => {
        performSave(numericAmount);
      }, 600);
    }
  };

  const handlePresetClick = (preset: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setAmountInput(String(preset));
    performSave(preset);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const numericAmount = parseFloat(amountInput);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid positive money amount.");
      setSaveStatus("error");
      return;
    }

    performSave(numericAmount);
  };

  const currentMonthLabel = `${getMonthName(selectedMonth)} ${selectedYear}`;
  const isOverBudget = summary.isOverBudget;

  const formattedDateBadge = (() => {
    try {
      if (!selectedDate) return currentMonthLabel;
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d));
      return dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return currentMonthLabel;
    }
  })();

  return (
    <div className="space-y-6">
      {/* Top Banner: Date Selection & Money Amount Configuration Card */}
      <Card className="border shadow-xs bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span>Monthly Income & Budget for {currentMonthLabel}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Enter your money amount for any specific date to automatically save and compute the 50/20/20/10 split
              </CardDescription>
            </div>

            {summary.budget && onOpenAddExpense && (
              <Button
                onClick={onOpenAddExpense}
                size="sm"
                className="gap-1.5 shrink-0 h-9"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <form
            onSubmit={handleManualSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            {/* Specific Date Picker */}
            <div className="sm:w-48 shrink-0">
              <Label htmlFor="money-target-date" className="text-xs font-semibold block mb-1">
                Target Date
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="money-target-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    if (newDate) onDateChange(newDate);
                  }}
                  className="pl-9 text-xs sm:text-sm font-medium h-11"
                  aria-label="Specific Date"
                  required
                />
              </div>
            </div>

            {/* Money Amount Input */}
            <div className="flex-1">
              <Label htmlFor="money-amount-input" className="text-xs font-semibold block mb-1">
                Income / Fund Amount (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-base select-none">
                  ₹
                </span>
                <Input
                  id="money-amount-input"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="5000"
                  value={amountInput}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={() => {
                    const num = parseFloat(amountInput);
                    if (!isNaN(num) && num > 0) performSave(num);
                  }}
                  className="pl-8 text-base sm:text-lg font-bold font-mono h-11"
                  aria-label="Money Amount"
                />
              </div>
            </div>

            {/* Save / Status Button */}
            <div className="sm:self-end">
              <Button
                type="submit"
                disabled={saveStatus === "saving"}
                className="h-11 px-5 font-semibold gap-2 w-full sm:w-auto shrink-0 transition-all"
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-300" />
                    <span>Saved</span>
                  </>
                ) : (
                  <span>{summary.budget ? "Update Allocation" : "Save Amount"}</span>
                )}
              </Button>
            </div>
          </form>

          {/* Live Auto-Save Status Feedback */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
            <div className="flex items-center gap-1.5">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-primary font-medium animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Auto-saving amount...</span>
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in-50">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved automatically for {formattedDateBadge}</span>
                </span>
              )}
              {saveStatus === "idle" && (
                <span className="text-[11px] text-muted-foreground">
                  Automatically saves when you enter or change the money amount for any date.
                </span>
              )}
            </div>
            <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
              Balanced 50/20/20/10 Split
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Presets:
            </span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="px-2.5 py-1 text-xs font-mono font-medium rounded-md border bg-muted/40 hover:bg-muted hover:text-foreground text-muted-foreground transition-all"
              >
                {formatMoney(preset)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Over Budget Alert if applicable */}
      {isOverBudget && (
        <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-3 animate-in fade-in-50 duration-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Over Budget: </span>
            Total spending for {currentMonthLabel} exceeds total income by{" "}
            <strong className="font-mono">
              {formatMoney(Math.abs(summary.totalRemaining))}
            </strong>
            .
          </div>
        </div>
      )}

      {/* 3 Metric Cards: Total Income, Total Expenses, Net Balance */}
      {summary.budget && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Income
              </CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-foreground">
                {formatMoney(summary.budget.amount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Income for {currentMonthLabel}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono text-amber-600">
                {formatMoney(summary.totalSpent)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.recentExpenses.length} expense record
                {summary.recentExpenses.length === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Net Balance
              </CardTitle>
              <ArrowUpRight
                className={`h-4 w-4 ${
                  isOverBudget ? "text-destructive" : "text-emerald-600"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold font-mono ${
                  isOverBudget ? "text-destructive" : "text-emerald-600"
                }`}
              >
                {formatMoney(summary.totalRemaining)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isOverBudget ? "Deficit / Over budget" : "Net positive balance"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
