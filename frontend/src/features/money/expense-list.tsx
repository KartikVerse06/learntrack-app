"use client";

import { useState } from "react";
import { Trash2, Loader2, Calendar } from "lucide-react";
import { formatMoney, MONEY_CATEGORIES } from "@/lib/money/money-utils";
import { MoneyEmptyExpenses } from "./money-empty-state";
import type { MoneyExpenseDTO } from "@/lib/money/money-types";

interface ExpenseListProps {
  expenses: MoneyExpenseDTO[];
  onDeleteExpense: (id: string) => Promise<{ success: boolean; error?: string }>;
  onAddExpense?: () => void;
}

export function ExpenseList({
  expenses,
  onDeleteExpense,
  onAddExpense,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (expenses.length === 0) {
    return <MoneyEmptyExpenses onAddExpense={onAddExpense} />;
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    setDeletingId(id);
    try {
      await onDeleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {expenses.map((expense) => {
        const catConfig = MONEY_CATEGORIES[expense.category];
        const isDeleting = deletingId === expense.id;

        return (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3.5 rounded-xl border bg-card/60 backdrop-blur-xs hover:border-border/80 transition-all gap-3"
          >
            {/* Category & Details */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span
                className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight shrink-0 border"
                style={{
                  backgroundColor: `${catConfig.color}15`,
                  color: catConfig.color,
                  borderColor: `${catConfig.color}35`,
                }}
              >
                {catConfig.label}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {expense.note || `${catConfig.label} Expense`}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>{expense.date}</span>
                </div>
              </div>
            </div>

            {/* Amount & Delete */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                {formatMoney(expense.amount)}
              </span>

              <button
                type="button"
                onClick={() => handleDelete(expense.id)}
                disabled={isDeleting}
                aria-label={`Delete expense ${expense.note || expense.category}`}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
