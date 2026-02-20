import { describe, expect, it } from "vitest";
import { computeMonthlyProjection, computeCashFlow } from "./financial.js";

describe("computeMonthlyProjection", () => {
  it("returns identical amount for monthly charge", () => {
    const result = computeMonthlyProjection({
      rev: [{ amount: 2000 }],
      charges: [{ amount: 300, freq: "monthly" }],
      exp: []
    });
    expect(result.fixedCharges).toBe(300);
  });

  it("normalizes quarterly charge to monthly (/3)", () => {
    const result = computeMonthlyProjection({
      rev: [],
      charges: [{ amount: 900, freq: "quarterly" }],
      exp: []
    });
    expect(result.fixedCharges).toBe(300);
  });

  it("normalizes annual charge to monthly (/12)", () => {
    const result = computeMonthlyProjection({
      rev: [],
      charges: [{ amount: 1200, freq: "annual" }],
      exp: []
    });
    expect(result.fixedCharges).toBe(100);
  });

  it("sums mixed charges correctly", () => {
    const result = computeMonthlyProjection({
      rev: [],
      charges: [
        { amount: 200, freq: "monthly" },
        { amount: 600, freq: "quarterly" },
        { amount: 1200, freq: "annual" }
      ],
      exp: []
    });
    expect(result.fixedCharges).toBe(500);
  });
});

describe("computeCashFlow", () => {
  it("returns 0 without movement/opening balance", () => {
    const result = computeCashFlow({ movements: [] });
    expect(result).toBe(0);
  });

  it("returns openingBalance when no movement exists", () => {
    const result = computeCashFlow({ openingBalance: 1000, movements: [] });
    expect(result).toBe(1000);
  });

  it("applies credit/debit movements", () => {
    const result = computeCashFlow({
      openingBalance: 1000,
      movements: [
        { type: "credit", amount: 250 },
        { type: "debit", amount: 100 }
      ]
    });
    expect(result).toBe(1150);
  });

  it("ignores deleted movements", () => {
    const result = computeCashFlow({
      openingBalance: 1000,
      movements: [
        { type: "credit", amount: 200 },
        { type: "debit", amount: 300, deleted: true }
      ]
    });
    expect(result).toBe(1200);
  });
});

