import type { MoneyAllocation, MoneyCategory } from "./money-types";

/**
 * Pure 50/20/20/10 Budget Allocation Calculation
 *
 * Formula:
 * Needs   = Amount * 0.50
 * Savings = Amount * 0.20
 * Growth  = Amount * 0.20
 * Wants   = Amount * 0.10
 *
 * Invariant:
 * needs + savings + growth + wants === amount
 *
 * Uses smallest currency unit (cent / paisa) integer math to eliminate
 * JavaScript IEEE-754 floating point imprecision.
 */
export function calculateMoneyAllocation(amount: number): MoneyAllocation {
  if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative number.");
  }

  // Convert to integer units (cents/paise)
  const totalUnits = Math.round(amount * 100);
  const needsUnits = Math.round(totalUnits * 0.50);
  const savingsUnits = Math.round(totalUnits * 0.20);
  const growthUnits = Math.round(totalUnits * 0.20);

  // Remainder assigned to wants to guarantee exact conservation of the entered total
  const wantsUnits = totalUnits - (needsUnits + savingsUnits + growthUnits);

  const needs = needsUnits / 100;
  const savings = savingsUnits / 100;
  const growth = growthUnits / 100;
  const wants = wantsUnits / 100;
  const total = (needsUnits + savingsUnits + growthUnits + wantsUnits) / 100;

  return {
    needs,
    savings,
    growth,
    wants,
    total,
  };
}

/**
 * Formats a monetary amount into a clean Indian Rupee representation.
 * Whole rupee amounts are displayed without trailing decimal places (e.g. ₹5,000).
 * Fractional amounts display 2 decimal places (e.g. ₹2,500.50).
 */
export function formatMoney(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const isInteger = Math.round(absAmount * 100) % 100 === 0;

  const formatted = absAmount.toLocaleString("en-IN", {
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Category metadata and UI definitions
 */
export const MONEY_CATEGORIES = {
  NEEDS: {
    id: "NEEDS" as MoneyCategory,
    label: "Needs",
    percentage: 50,
    percentageLabel: "50%",
    color: "#3B82F6",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-900/50",
    textColor: "text-blue-700 dark:text-blue-300",
    description: "Essential expenses such as food, rent, bills, transportation, and required payments.",
  },
  SAVINGS: {
    id: "SAVINGS" as MoneyCategory,
    label: "Savings",
    percentage: 20,
    percentageLabel: "20%",
    color: "#10B981",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-900/50",
    textColor: "text-emerald-700 dark:text-emerald-300",
    description: "Money reserved for emergency fund, future savings, and financial goals.",
  },
  GROWTH: {
    id: "GROWTH" as MoneyCategory,
    label: "Growth",
    percentage: 20,
    percentageLabel: "20%",
    color: "#8B5CF6",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-900/50",
    textColor: "text-purple-700 dark:text-purple-300",
    description: "Money used for education, courses, books, skill development, and career improvement.",
  },
  WANTS: {
    id: "WANTS" as MoneyCategory,
    label: "Wants",
    percentage: 10,
    percentageLabel: "10%",
    color: "#F59E0B",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-900/50",
    textColor: "text-amber-700 dark:text-amber-300",
    description: "Optional spending such as entertainment, eating out, shopping, and hobbies.",
  },
} as const;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function getMonthName(month: number): string {
  if (month >= 1 && month <= 12) {
    return MONTH_NAMES[month - 1];
  }
  return `Month ${month}`;
}
