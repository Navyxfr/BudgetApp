import { describe, expect, it } from "vitest";
import { computeCashFlow } from "../core/financial.js";
import { mergeByUpdatedAt } from "../core/syncMerge.js";
import { budgetReducer } from "./budgetReducer.js";
import { addExpense, addSavingsAccount, addSavingsMovement } from "./actions.js";

const baseState = () => ({
  cfg: { dark: "auto", persons: [], categories: [] },
  loans: [],
  savings: [],
  investments: [],
  months: {
    "2026-02": { exp: [], charges: [] }
  }
});

describe("architecture integrity round-trip", () => {
  it("keeps reducer + savings + mergeByUpdatedAt coherent", () => {
    let localState = baseState();
    localState = budgetReducer(
      localState,
      addExpense("2026-02", { id: "e1", cid: "cat-1", amount: 45, date: "2026-02-10", desc: "Cafe" })
    );
    localState = budgetReducer(
      localState,
      addSavingsAccount({ id: "s1", name: "Livret", openingBalance: 1000, movements: [] })
    );
    localState = budgetReducer(
      localState,
      addSavingsMovement("s1", { id: "m1", type: "credit", amount: 200, date: "2026-02-11" })
    );

    const cloudState = budgetReducer(
      localState,
      addExpense("2026-02", { id: "e2", cid: "cat-1", amount: 12, date: "2026-02-12", desc: "Bus" })
    );

    const mergeResult = mergeByUpdatedAt({
      local: { exists: true, deleted: false, updatedAt: 100, value: JSON.stringify(localState) },
      cloud: { exists: true, deleted: false, updatedAt: 101, value: JSON.stringify(cloudState) }
    });

    expect(mergeResult.winner).toBe("cloud");

    const mergedState = JSON.parse(mergeResult.record.value);
    expect(mergedState.months["2026-02"].exp).toHaveLength(2);
    expect(computeCashFlow(mergedState)).toBe(1200);
  });
});

