"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatMoney, MONEY_CATEGORIES } from "@/lib/money/money-utils";
import type {
  CategorySpending,
  MoneyAllocation,
  MoneyCategory,
} from "@/lib/money/money-types";

interface MoneyAllocationProps {
  allocation: MoneyAllocation;
  categoryBreakdown: Record<MoneyCategory, CategorySpending>;
}

export function MoneyAllocationView({
  allocation,
  categoryBreakdown,
}: MoneyAllocationProps) {
  const categories: MoneyCategory[] = ["NEEDS", "SAVINGS", "GROWTH", "WANTS"];

  // Chart dataset based on 50/20/20/10
  const chartData = categories.map((cat) => ({
    name: MONEY_CATEGORIES[cat].label,
    value: allocation[cat.toLowerCase() as keyof MoneyAllocation],
    color: MONEY_CATEGORIES[cat].color,
    percentage: MONEY_CATEGORIES[cat].percentageLabel,
  }));

  return (
    <div className="space-y-6">
      {/* 4 Category Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const config = MONEY_CATEGORIES[cat];
          const spending = categoryBreakdown[cat];
          const allocated = allocation[cat.toLowerCase() as keyof MoneyAllocation];
          const spent = spending?.spent ?? 0;
          const remaining = spending?.remaining ?? allocated;
          const isOver = spending?.isOverBudget ?? false;
          const spentPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;

          return (
            <Card
              key={cat}
              className="relative overflow-hidden border bg-card/80 backdrop-blur-xs shadow-xs transition-all hover:shadow-sm"
            >
              {/* Category Color Accent Header Bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: config.color }}
              />

              <CardHeader className="pb-2 pt-4 px-4 sm:px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">
                      {config.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-mono font-bold py-0.2 px-1.5"
                      style={{
                        borderColor: `${config.color}40`,
                        color: config.color,
                        backgroundColor: `${config.color}10`,
                      }}
                    >
                      {config.percentageLabel}
                    </Badge>
                  </div>

                  {isOver ? (
                    <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0.5">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Over Budget</span>
                    </Badge>
                  ) : (
                    <span className="text-xs font-mono text-muted-foreground">
                      {spentPct}% spent
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-4 sm:px-5 pb-5 space-y-4">
                {/* Allocated Amount */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Allocated
                  </span>
                  <div className="text-2xl font-extrabold font-mono text-foreground">
                    {formatMoney(allocated)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${spentPct}%`,
                        backgroundColor: isOver ? "#EF4444" : config.color,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                    <span>Spent: {formatMoney(spent)}</span>
                    <span
                      className={
                        isOver
                          ? "text-destructive font-bold"
                          : "text-foreground font-medium"
                      }
                    >
                      Left: {formatMoney(remaining)}
                    </span>
                  </div>
                </div>

                {/* Meaning / Explanation */}
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border/60">
                  {config.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Invariant Verification & Visual Chart Card */}
      <Card className="shadow-xs overflow-hidden border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>50 / 20 / 20 / 10 Formula Invariant</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Needs (50%) + Savings (20%) + Growth (20%) + Wants (10%) = Total Entered Amount
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-lg text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-xs font-semibold">Total Allocated:</span>
              <span className="text-sm font-extrabold font-mono text-emerald-800 dark:text-emerald-200">
                {formatMoney(allocation.total)}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Donut Chart */}
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown) => [formatMoney(Number(val) || 0), "Allocated"]}
                    contentStyle={{
                      borderRadius: "8px",
                      fontSize: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      color: "#000",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Formula Breakdown Details */}
            <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
              {categories.map((cat) => {
                const config = MONEY_CATEGORIES[cat];
                const amt = allocation[cat.toLowerCase() as keyof MoneyAllocation];

                return (
                  <div
                    key={cat}
                    className="p-3 rounded-lg border bg-card/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-sm shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      <div>
                        <span className="font-semibold text-foreground">
                          {config.label}
                        </span>
                        <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                          ({config.percentageLabel})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-foreground">
                      {formatMoney(amt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
