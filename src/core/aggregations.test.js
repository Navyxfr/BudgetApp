import { describe, expect, test } from "vitest";
import {
  sumRev,
  sumFC,
  sumSpent,
  personBalance,
  savBalance,
  getMonth,
  defaultMonth
} from "./aggregations.js";

describe("aggregations", () => {
  test("sumRev totals all revenues", () => {
    const md = { rev: [{ amount: 1200 }, { amount: 300 }, { amount: 0 }] };
    expect(sumRev(md)).toBe(1500);
  });

  test("sumFC totals fixed charges", () => {
    const md = { charges: [{ amount: 400 }, { amount: 100.5 }] };
    expect(sumFC(md)).toBe(500.5);
  });

  test("sumSpent totals expenses globally and by category", () => {
    const md = {
      exp: [
        { cid: "food", amount: 50 },
        { cid: "food", amount: 25 },
        { cid: "fuel", amount: 40 }
      ]
    };
    expect(sumSpent(md)).toBe(115);
    expect(sumSpent(md, "food")).toBe(75);
  });

  test("personBalance computes revenue minus allocations", () => {
    const md = {
      rev: [{ pid: "A", amount: 2000 }],
      alloc: { A: { fc: 500, vc: 300, sav: [{ amount: 100 }], inv: [{ amount: 50 }] } }
    };
    expect(personBalance(md, "A")).toBe(1050);
  });

  test("savBalance supports openingBalance and legacy balance", () => {
    expect(savBalance({ openingBalance: 1000, movements: [{ amount: 50 }, { amount: -20 }] })).toBe(1030);
    expect(savBalance({ balance: 500, movements: [{ amount: 10 }] })).toBe(510);
  });

  test("getMonth builds a default month when missing", () => {
    const state = { cfg: { persons: [{ id: "A", name: "A", type: "adult" }], categories: [] }, loans: [], months: {} };
    const deps = { uid: () => "id1", loanMonths: () => ({ t: 0 }), calcMP: () => 0 };
    const md = getMonth(state, "2026-02", deps);
    expect(md).toBeTruthy();
    expect(md.ok).toBe(false);
    expect(Array.isArray(md.rev)).toBe(true);
    expect(Array.isArray(md.charges)).toBe(true);
  });

  test("defaultMonth carries forward previous validated month", () => {
    const state = {
      cfg: { persons: [{ id: "A", name: "A", type: "adult" }], categories: [] },
      loans: [],
      months: {
        "2026-01": { ok: true, rev: [{ id: "r1", amount: 1000 }], charges: [{ id: "c1", amount: 300, auto: false }], cb: [] }
      }
    };
    const deps = { uid: () => "id-x", loanMonths: () => ({ t: 0 }), calcMP: () => 0 };
    const md = defaultMonth("2026-02", state, deps);
    expect(md.ok).toBe(false);
    expect(md.rev.length).toBe(1);
    expect(md.charges.length).toBe(1);
  });
});
