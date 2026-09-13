/**
 * Core Money Management Types & DTOs
 */

export type MoneyCategory = "NEEDS" | "SAVINGS" | "GROWTH" | "WANTS";

export interface MoneyAllocation {
  needs: number;
  savings: number;
  growth: number;
  wants: number;
  total: number;
}

export interface MoneyBudgetDTO {
  id: string;
  userId: string;
  month: number;
  year: number;
  amount: number;
  needsAmount: number;
  savingsAmount: number;
  growthAmount: number;
  wantsAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoneyExpenseDTO {
  id: string;
  userId: string;
  budgetId: string;
  category: MoneyCategory;
  amount: number;
  date: string; // ISO YYYY-MM-DD
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategorySpending {
  category: MoneyCategory;
  label: string;
  percentage: number;
  allocated: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  description: string;
}

export interface MoneySummaryDTO {
  budget: MoneyBudgetDTO | null;
  allocation: MoneyAllocation | null;
  totalSpent: number;
  totalRemaining: number;
  isOverBudget: boolean;
  categoryBreakdown: Record<MoneyCategory, CategorySpending>;
  recentExpenses: MoneyExpenseDTO[];
}

export interface MonthlyHistoryItemDTO {
  budgetId: string;
  month: number;
  year: number;
  monthName: string;
  amount: number; // Total monthly income / budget
  totalIncome?: number; // Explicit income alias
  totalSpent: number; // Total monthly expenses
  totalRemaining: number; // Balance (income - expenses)
  netBalance?: number; // Explicit balance alias
  isOverBudget: boolean;
}

export interface YearlyHistoryItemDTO {
  year: number;
  totalIncome: number;
  totalSpent: number;
  netBalance: number;
  isOverBudget: boolean;
  monthsCount: number;
  months: MonthlyHistoryItemDTO[];
}

export interface FinancialHistoryDTO {
  monthlyHistory: MonthlyHistoryItemDTO[];
  yearlyHistory: YearlyHistoryItemDTO[];
  grandTotal: {
    totalIncome: number;
    totalSpent: number;
    netBalance: number;
  };
}
