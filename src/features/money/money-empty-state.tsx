"use client";

import { Wallet, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MoneyEmptyBudgetProps {
  onFocusInput?: () => void;
}

export function MoneyEmptyBudget({ onFocusInput }: MoneyEmptyBudgetProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 backdrop-blur-xs">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
        <Wallet className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">
        No monthly budget yet
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        Enter your monthly income or study stipend above to automatically generate your balanced{" "}
        <strong className="text-foreground font-semibold">50 / 20 / 20 / 10</strong> financial allocation.
      </p>
      {onFocusInput && (
        <Button onClick={onFocusInput} variant="default" size="sm" className="gap-2">
          <Wallet className="h-4 w-4" />
          <span>Enter Monthly Amount</span>
        </Button>
      )}
    </div>
  );
}

export function MoneyEmptyExpenses({ onAddExpense }: { onAddExpense?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10">
      <Receipt className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <h4 className="text-sm font-semibold text-foreground mb-1">
        No expenses recorded yet
      </h4>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">
        Log your day-to-day spending across Needs, Savings, Growth, or Wants to track remaining amounts.
      </p>
      {onAddExpense && (
        <Button onClick={onAddExpense} variant="outline" size="sm" className="text-xs">
          Add First Expense
        </Button>
      )}
    </div>
  );
}
