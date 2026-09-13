"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MONEY_CATEGORIES } from "@/lib/money/money-utils";
import type { MoneyCategory } from "@/lib/money/money-types";

interface ExpenseFormProps {
  budgetId: string;
  onAddExpense: (expense: {
    budgetId: string;
    category: MoneyCategory;
    amount: number;
    date: string;
    note?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function ExpenseFormDialog({
  budgetId,
  onAddExpense,
  isOpen,
  onOpenChange,
  triggerButton,
}: ExpenseFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<MoneyCategory>("NEEDS");
  const [date, setDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage("Please enter a valid positive amount.");
      return;
    }

    if (!date) {
      setErrorMessage("Please select an expense date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAddExpense({
        budgetId,
        category,
        amount: numericAmount,
        date,
        note: note.trim() ? note.trim() : null,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save expense.");
      } else {
        // Reset form
        setAmount("");
        setNote("");
        setOpen(false);
      }
    } catch {
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: MoneyCategory[] = ["NEEDS", "SAVINGS", "GROWTH", "WANTS"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Add Expense</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Record spending against your monthly 50/20/20/10 budget allocation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive font-medium">
              {errorMessage}
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-amount" className="text-xs font-semibold">
              Amount (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
                ₹
              </span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 text-sm font-medium"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Category</Label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const config = MONEY_CATEGORIES[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                        : "border-border hover:bg-muted/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-foreground">
                        {config.label}
                      </span>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {config.percentageLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {config.label === "Needs"
                        ? "Bills, food, rent"
                        : config.label === "Savings"
                        ? "Emergency, savings"
                        : config.label === "Growth"
                        ? "Courses, books"
                        : "Entertainment, hobby"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-date" className="text-xs font-semibold">
              Date
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="expense-note" className="text-xs font-semibold">
              Note (Optional)
            </Label>
            <Input
              id="expense-note"
              type="text"
              placeholder="e.g. Electricity bill, Course subscription"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={255}
              className="text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Expense</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
