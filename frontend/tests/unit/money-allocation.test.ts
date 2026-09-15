import { describe, it, expect } from "vitest";
import {
  calculateMoneyAllocation,
  formatMoney,
  getMonthName,
  MONEY_CATEGORIES,
} from "@/lib/money/money-utils";

describe("50/20/20/10 Money Allocation Formula", () => {
  it("should calculate exact allocations for required benchmark amounts", () => {
    // 1. ₹500
    const alloc500 = calculateMoneyAllocation(500);
    expect(alloc500.needs).toBe(250);
    expect(alloc500.savings).toBe(100);
    expect(alloc500.growth).toBe(100);
    expect(alloc500.wants).toBe(50);
    expect(alloc500.total).toBe(500);
    expect(alloc500.needs + alloc500.savings + alloc500.growth + alloc500.wants).toBe(500);

    // 2. ₹1,000
    const alloc1000 = calculateMoneyAllocation(1000);
    expect(alloc1000.needs).toBe(500);
    expect(alloc1000.savings).toBe(200);
    expect(alloc1000.growth).toBe(200);
    expect(alloc1000.wants).toBe(100);
    expect(alloc1000.total).toBe(1000);
    expect(alloc1000.needs + alloc1000.savings + alloc1000.growth + alloc1000.wants).toBe(1000);

    // 3. ₹3,700
    const alloc3700 = calculateMoneyAllocation(3700);
    expect(alloc3700.needs).toBe(1850);
    expect(alloc3700.savings).toBe(740);
    expect(alloc3700.growth).toBe(740);
    expect(alloc3700.wants).toBe(370);
    expect(alloc3700.total).toBe(3700);
    expect(alloc3700.needs + alloc3700.savings + alloc3700.growth + alloc3700.wants).toBe(3700);

    // 4. ₹5,000
    const alloc5000 = calculateMoneyAllocation(5000);
    expect(alloc5000.needs).toBe(2500);
    expect(alloc5000.savings).toBe(1000);
    expect(alloc5000.growth).toBe(1000);
    expect(alloc5000.wants).toBe(500);
    expect(alloc5000.total).toBe(5000);
    expect(alloc5000.needs + alloc5000.savings + alloc5000.growth + alloc5000.wants).toBe(5000);

    // 5. ₹12,500
    const alloc12500 = calculateMoneyAllocation(12500);
    expect(alloc12500.needs).toBe(6250);
    expect(alloc12500.savings).toBe(2500);
    expect(alloc12500.growth).toBe(2500);
    expect(alloc12500.wants).toBe(1250);
    expect(alloc12500.total).toBe(12500);
    expect(alloc12500.needs + alloc12500.savings + alloc12500.growth + alloc12500.wants).toBe(12500);
  });

  it("should uphold the invariant needs + savings + growth + wants === entered amount for odd and decimal amounts", () => {
    const testCases = [
      1,
      7,
      33.33,
      99.99,
      501,
      1234.56,
      87654.32,
      100000,
      10000000,
    ];

    for (const amount of testCases) {
      const result = calculateMoneyAllocation(amount);
      const sum = Number((result.needs + result.savings + result.growth + result.wants).toFixed(2));
      expect(sum).toBe(Number(amount.toFixed(2)));
      expect(result.total).toBe(Number(amount.toFixed(2)));
    }
  });

  it("should handle 0 amount gracefully", () => {
    const alloc0 = calculateMoneyAllocation(0);
    expect(alloc0.needs).toBe(0);
    expect(alloc0.savings).toBe(0);
    expect(alloc0.growth).toBe(0);
    expect(alloc0.wants).toBe(0);
    expect(alloc0.total).toBe(0);
  });

  it("should throw an error for negative amounts or invalid input", () => {
    expect(() => calculateMoneyAllocation(-500)).toThrow();
    expect(() => calculateMoneyAllocation(NaN)).toThrow();
    // @ts-expect-error invalid input type
    expect(() => calculateMoneyAllocation("5000")).toThrow();
  });

  it("should verify total invariant across 100 random amounts", () => {
    for (let i = 0; i < 100; i++) {
      const randomAmount = Math.round((Math.random() * 50000 + 1) * 100) / 100;
      const result = calculateMoneyAllocation(randomAmount);
      const sum = Number((result.needs + result.savings + result.growth + result.wants).toFixed(2));
      expect(sum).toBe(randomAmount);
      expect(result.total).toBe(randomAmount);
    }
  });
});

describe("formatMoney utility", () => {
  it("should format whole rupee amounts without decimal places", () => {
    expect(formatMoney(500)).toBe("₹500");
    expect(formatMoney(1000)).toBe("₹1,000");
    expect(formatMoney(2500)).toBe("₹2,500");
    expect(formatMoney(5000)).toBe("₹5,000");
    expect(formatMoney(12500)).toBe("₹12,500");
  });

  it("should format fractional amounts with two decimal places", () => {
    expect(formatMoney(2500.5)).toBe("₹2,500.50");
    expect(formatMoney(1234.56)).toBe("₹1,234.56");
  });

  it("should handle zero and negative amounts", () => {
    expect(formatMoney(0)).toBe("₹0");
    expect(formatMoney(-500)).toBe("-₹500");
    expect(formatMoney(-1250.75)).toBe("-₹1,250.75");
  });
});

describe("Money Categories and Months configuration", () => {
  it("should provide exact category metadata", () => {
    expect(MONEY_CATEGORIES.NEEDS.percentage).toBe(50);
    expect(MONEY_CATEGORIES.SAVINGS.percentage).toBe(20);
    expect(MONEY_CATEGORIES.GROWTH.percentage).toBe(20);
    expect(MONEY_CATEGORIES.WANTS.percentage).toBe(10);
    expect(MONEY_CATEGORIES.NEEDS.label).toBe("Needs");
    expect(MONEY_CATEGORIES.SAVINGS.label).toBe("Savings");
    expect(MONEY_CATEGORIES.GROWTH.label).toBe("Growth");
    expect(MONEY_CATEGORIES.WANTS.label).toBe("Wants");
  });

  it("should map month numbers to names correctly", () => {
    expect(getMonthName(1)).toBe("January");
    expect(getMonthName(9)).toBe("September");
    expect(getMonthName(12)).toBe("December");
  });
});
