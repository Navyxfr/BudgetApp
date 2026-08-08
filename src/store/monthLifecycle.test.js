import { describe, expect, it } from "vitest";
import { createEmptyMonth, duplicateMonth } from "../core/months.js";
import { budgetReducer } from "./budgetReducer.js";
import {
  addExpense,
  addFixedCharge,
  createMonth,
  hydrateFromStorage,
  setActiveMonth,
  updateExpense
} from "./actions.js";

const dependencies = {
  uid: (() => {
    let id = 0;
    return () => `generated-${++id}`;
  })(),
  now: () => "2026-08-08T12:00:00.000Z",
  loanMonths: () => ({ t: 240 }),
  calcMP: () => 800
};

const augustState = {
  dataVersion: 2,
  activeMonth: "2026-08",
  cfg: {
    dark: "auto",
    onb: true,
    persons: [{ id: "adult", name: "Alex", type: "adult" }],
    categories: [{ id: "food", name: "Courses" }]
  },
  loans: [{ id: "mortgage", name: "Maison", s: "2025-01-01", e: "2045-01-01", mp: 800 }],
  savings: [],
  investments: [],
  months: {
    "2026-08": {
      ok: true,
      rev: [{ id: "aug-income", label: "Salaire", amount: 3000, pid: "adult" }],
      charges: [
        { id: "aug-rent", name: "Internet", amount: 40, auto: false },
        { id: "aug-loan", name: "Maison", amount: 800, auto: true, lid: "mortgage" }
      ],
      cb: [{ cid: "food", budget: 500 }],
      alloc: { adult: { fc: 840, vc: 500, sav: [], inv: [] } },
      exp: [
        { id: "aug-expense-1", cid: "food", amount: 25, date: "2026-08-03" },
        { id: "aug-expense-2", cid: "food", amount: 15, date: "2026-08-04" }
      ]
    }
  }
};

describe("complete month lifecycle", () => {
  it("copies September independently, survives reload, then creates an empty October", () => {
    let state = budgetReducer(null, hydrateFromStorage(augustState));
    const september = duplicateMonth("2026-08", "2026-09", state, dependencies);
    state = budgetReducer(state, createMonth("2026-09", september));

    expect(state.months["2026-09"].rev[0].amount).toBe(3000);
    expect(state.months["2026-09"].charges.some(charge => charge.name === "Internet")).toBe(true);
    expect(state.months["2026-09"].cb[0].budget).toBe(500);
    expect(state.months["2026-09"].exp).toEqual([]);

    state = budgetReducer(state, addExpense("2026-09", { id: "sep-expense", cid: "food", amount: 60 }));
    state = budgetReducer(state, updateExpense("2026-09", "sep-expense", { amount: 75 }));
    state = budgetReducer(state, addFixedCharge("2026-09", { id: "sep-charge", name: "Sport", amount: 30 }));
    state = budgetReducer(state, setActiveMonth("2026-08"));

    expect(state.months["2026-08"]).toEqual(augustState.months["2026-08"]);
    expect(state.months["2026-09"].exp[0].amount).toBe(75);

    const reloaded = budgetReducer(null, hydrateFromStorage(JSON.parse(JSON.stringify(state))));
    expect(reloaded.activeMonth).toBe("2026-08");
    expect(reloaded.months["2026-09"].exp[0].amount).toBe(75);
    expect(reloaded.dataVersion).toBeGreaterThanOrEqual(3);

    const october = createEmptyMonth("2026-10", reloaded, dependencies);
    const withOctober = budgetReducer(reloaded, createMonth("2026-10", october));

    expect(withOctober.activeMonth).toBe("2026-10");
    expect(withOctober.months["2026-10"].rev[0].amount).toBe(0);
    expect(withOctober.months["2026-10"].cb[0].budget).toBe(0);
    expect(withOctober.months["2026-10"].exp).toEqual([]);
    expect(withOctober.months["2026-10"].charges).toHaveLength(1);
    expect(withOctober.months["2026-10"].charges[0]).toMatchObject({ lid: "mortgage", auto: true });
  });
});
