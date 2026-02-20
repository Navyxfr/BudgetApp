import { describe, expect, it } from "vitest";
import { savBalance } from "../core/financial.js";
import { budgetReducer } from "./budgetReducer.js";
import {
  hydrateFromStorage,
  importBudget,
  mergeFromCloud,
  addExpense,
  addFixedCharge,
  addLoan,
  addSavingsAccount,
  addSavingsMovement,
  applyExtraPayment,
  deleteExpense,
  deleteSavingsMovement,
  updateExpense
} from "./actions.js";

const createState = () => ({
  cfg: { dark: "auto", persons: [], categories: [] },
  loans: [],
  savings: [],
  investments: [],
  months: {
    "2026-02": { exp: [], charges: [] }
  }
});

const snapshot = obj => JSON.parse(JSON.stringify(obj));

describe("budgetReducer - expenses", () => {
  it("ADD_EXPENSE adds one expense entry", () => {
    const state = createState();
    const next = budgetReducer(
      state,
      addExpense("2026-02", { id: "e1", cid: "c1", amount: 10, date: "2026-02-01", desc: "" })
    );
    expect(next.months["2026-02"].exp).toHaveLength(1);
    expect(next.months["2026-02"].exp[0].id).toBe("e1");
  });

  it("UPDATE_EXPENSE updates only target entry", () => {
    const state = createState();
    state.months["2026-02"].exp = [
      { id: "e1", amount: 10, date: "2026-02-01" },
      { id: "e2", amount: 20, date: "2026-02-01" }
    ];
    const next = budgetReducer(state, updateExpense("2026-02", "e2", { amount: 99 }));
    expect(next.months["2026-02"].exp.find(e => e.id === "e1")?.amount).toBe(10);
    expect(next.months["2026-02"].exp.find(e => e.id === "e2")?.amount).toBe(99);
  });

  it("DELETE_EXPENSE removes the target expense", () => {
    const state = createState();
    state.months["2026-02"].exp = [{ id: "e1" }, { id: "e2" }];
    const next = budgetReducer(state, deleteExpense("2026-02", "e1"));
    expect(next.months["2026-02"].exp.map(e => e.id)).toEqual(["e2"]);
  });
});

describe("budgetReducer - savings", () => {
  it("ADD_SAVINGS_ACCOUNT creates account with openingBalance", () => {
    const state = createState();
    const next = budgetReducer(
      state,
      addSavingsAccount({ id: "s1", name: "Livret", openingBalance: 1000, movements: [] })
    );
    expect(next.savings).toHaveLength(1);
    expect(next.savings[0].openingBalance).toBe(1000);
  });

  it("ADD_SAVINGS_MOVEMENT updates account updatedAt and balance derivation", () => {
    const state = createState();
    state.savings = [{ id: "s1", name: "Livret", openingBalance: 1000, movements: [], updatedAt: "2026-01-01" }];
    const next = budgetReducer(
      state,
      addSavingsMovement("s1", { id: "m1", type: "credit", amount: 200, date: "2026-02-01" })
    );
    expect(next.savings[0].movements).toHaveLength(1);
    expect(next.savings[0].updatedAt).not.toBe("2026-01-01");
    expect(savBalance(next.savings[0])).toBe(1200);
  });

  it("DELETE_SAVINGS_MOVEMENT removes movement and keeps derived balance correct", () => {
    const state = createState();
    state.savings = [
      {
        id: "s1",
        openingBalance: 1000,
        movements: [
          { id: "m1", type: "credit", amount: 200 },
          { id: "m2", type: "debit", amount: 50 }
        ]
      }
    ];
    const next = budgetReducer(state, deleteSavingsMovement("s1", "m1"));
    expect(next.savings[0].movements.map(m => m.id)).toEqual(["m2"]);
    expect(savBalance(next.savings[0])).toBe(950);
  });
});

describe("budgetReducer - loans", () => {
  it("ADD_LOAN adds one loan", () => {
    const state = createState();
    const next = budgetReducer(state, addLoan({ id: "l1", name: "Credit", cap: 10000, rate: 3 }));
    expect(next.loans).toHaveLength(1);
    expect(next.loans[0].id).toBe("l1");
  });

  it("APPLY_EXTRA_PAYMENT reduces loan capital", () => {
    const state = createState();
    state.loans = [{ id: "l1", cap: 10000, rate: 3 }];
    const next = budgetReducer(state, applyExtraPayment("l1", 2500));
    expect(next.loans[0].cap).toBe(7500);
  });
});

describe("budgetReducer invariants", () => {
  it("does not mutate input state", () => {
    const state = createState();
    state.months["2026-02"].exp = [{ id: "e1", amount: 10 }];
    const before = snapshot(state);
    budgetReducer(state, updateExpense("2026-02", "e1", { amount: 42 }));
    expect(state).toEqual(before);
  });

  it("keeps root keys stable after action", () => {
    const state = createState();
    const next = budgetReducer(state, addFixedCharge("2026-02", { id: "c1", name: "Loyer", amount: 800, freq: "monthly" }));
    expect(Object.keys(next).sort()).toEqual(Object.keys(state).sort());
  });
});

describe("budgetReducer meta actions", () => {
  it("HYDRATE_FROM_STORAGE migrates legacy balance to openingBalance", () => {
    const legacy = createState();
    legacy.savings = [{ id: "s1", name: "Legacy", balance: 500, movements: [] }];
    const hydrated = budgetReducer(null, hydrateFromStorage(legacy));
    expect(hydrated.savings[0].openingBalance).toBe(500);
    expect(hydrated.dataVersion).toBeGreaterThanOrEqual(2);
  });

  it("IMPORT_BUDGET replace fully replaces state", () => {
    const stateA = createState();
    stateA.loans = [{ id: "l-old", cap: 1000 }];
    const stateB = createState();
    stateB.loans = [{ id: "l-new", cap: 2000 }];
    const next = budgetReducer(stateA, importBudget({ mode: "replace", data: stateB, source: "file" }));
    expect(next.loans).toEqual([{ id: "l-new", cap: 2000 }]);
  });

  it("MERGE_FROM_CLOUD merges by updatedAt strategy", () => {
    const local = createState();
    local.loans = [{ id: "l1", cap: 1000, updatedAt: 10 }];
    const cloud = createState();
    cloud.loans = [{ id: "l1", cap: 900, updatedAt: 11 }];
    const next = budgetReducer(local, mergeFromCloud({ cloudState: cloud, strategy: "updatedAt" }));
    expect(next.loans[0].cap).toBe(900);
  });
});
