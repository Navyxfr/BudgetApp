import { describe, expect, it } from "vitest";
import { createEmptyMonth, duplicateMonth, getMonthStatus, hasStoredMonth, listImportableMonths } from "./months.js";

const makeDeps = () => {
  let nextId = 0;
  return {
    uid: () => `new-${++nextId}`,
    now: () => "2026-08-08T12:00:00.000Z",
    loanMonths: () => ({ t: 120 }),
    calcMP: () => 650
  };
};

const makeState = () => ({
  cfg: {
    persons: [{ id: "p1", name: "Alex", type: "adult" }],
    categories: [
      { id: "food", name: "Courses" },
      { id: "old", name: "Archivée", ar: true }
    ]
  },
  loans: [
    { id: "loan-active", name: "Maison", s: "2026-01-01", e: "2030-12-31", mp: 650 },
    { id: "loan-ended", name: "Ancien", s: "2020-01-01", e: "2025-12-31", mp: 100 }
  ],
  months: {
    "2026-08": {
      ok: true,
      rev: [{ id: "revenue-old", label: "Salaire", amount: 3000, pid: "p1" }],
      charges: [
        { id: "manual-old", name: "Internet", amount: 40, auto: false },
        { id: "loan-old", name: "Maison", amount: 650, auto: true, lid: "loan-active" }
      ],
      cb: [{ cid: "food", budget: 500 }],
      alloc: { p1: { fc: 40, vc: 500, sav: [{ amount: 100 }], inv: [] } },
      exp: [{ id: "expense-old", cid: "food", amount: 12 }]
    }
  }
});

describe("month preparation", () => {
  it("creates and persists a truly empty planning month with active loan charges only", () => {
    const month = createEmptyMonth("2026-09", makeState(), makeDeps());

    expect(month).toMatchObject({
      monthKey: "2026-09",
      preparationMode: "empty",
      ok: false,
      exp: [],
      cb: [{ cid: "food", budget: 0 }]
    });
    expect(month.rev).toMatchObject([{ label: "Salaire Alex", amount: 0, pid: "p1" }]);
    expect(month.charges).toHaveLength(1);
    expect(month.charges[0]).toMatchObject({ lid: "loan-active", auto: true, amount: 650 });
    expect(month.alloc.p1).toEqual({ fc: 0, vc: 0, sav: [], inv: [] });
  });

  it("duplicates planning with new IDs, without transactions or duplicate loan charges", () => {
    const state = makeState();
    const month = duplicateMonth("2026-08", "2026-09", state, makeDeps());

    expect(month.preparationMode).toBe("copied");
    expect(month.copiedFrom).toBe("2026-08");
    expect(month.rev).toHaveLength(1);
    expect(month.rev[0].id).not.toBe(state.months["2026-08"].rev[0].id);
    expect(month.charges).toHaveLength(2);
    expect(month.charges.filter(charge => charge.lid === "loan-active")).toHaveLength(1);
    expect(month.charges.find(charge => charge.name === "Internet")?.id).not.toBe("manual-old");
    expect(month.cb).toEqual([{ cid: "food", budget: 500 }]);
    expect(month.exp).toEqual([]);
    expect(month.alloc.p1).toEqual({ fc: 0, vc: 0, sav: [], inv: [] });
  });

  it("keeps source and target independent after duplication", () => {
    const state = makeState();
    const month = duplicateMonth("2026-08", "2026-09", state, makeDeps());

    month.rev[0].amount = 4200;
    month.charges[1].amount = 55;
    month.cb[0].budget = 700;

    expect(state.months["2026-08"].rev[0].amount).toBe(3000);
    expect(state.months["2026-08"].charges[0].amount).toBe(40);
    expect(state.months["2026-08"].cb[0].budget).toBe(500);
  });

  it("handles December to January without copying real expenses", () => {
    const state = makeState();
    state.months["2026-12"] = state.months["2026-08"];
    const month = duplicateMonth("2026-12", "2027-01", state, makeDeps());

    expect(month.monthKey).toBe("2027-01");
    expect(month.copiedFrom).toBe("2026-12");
    expect(month.exp).toEqual([]);
  });

  it("distinguishes stored and missing months and exposes their status", () => {
    const state = makeState();
    expect(hasStoredMonth(state, "2026-08")).toBe(true);
    expect(hasStoredMonth(state, "2026-09")).toBe(false);
    expect(getMonthStatus(state.months["2026-08"])).toBe("completed");
    expect(getMonthStatus(createEmptyMonth("2026-09", state, makeDeps()))).toBe("empty");
    expect(getMonthStatus(undefined)).toBe("missing");
  });

  it("lists only filled months as import sources, newest first", () => {
    const state = makeState();
    state.months["2026-06"] = createEmptyMonth("2026-06", state, makeDeps());
    state.months["2026-07"] = {
      ...createEmptyMonth("2026-07", state, makeDeps()),
      cb: [{ cid: "food", budget: 300 }]
    };
    state.months["2026-09"] = { ...state.months["2026-08"], ok: false };

    expect(listImportableMonths(state, "2026-10")).toEqual([
      { monthKey: "2026-09", status: "prepared" },
      { monthKey: "2026-08", status: "completed" },
      { monthKey: "2026-07", status: "prepared" }
    ]);
    expect(listImportableMonths(state, "2026-09").some(item => item.monthKey === "2026-09")).toBe(false);
  });
});
