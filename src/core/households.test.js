import { describe, expect, it } from "vitest";
import { clearHouseholdsMeta, createBlankHouseholdState } from "./households.js";

describe("manual household lifecycle", () => {
  it("creates a usable blank household without onboarding data", () => {
    let id = 0;
    const state = createBlankHouseholdState({ uid: () => `category-${++id}` });

    expect(state.cfg.persons).toEqual([]);
    expect(state.months).toEqual({});
    expect(state.loans).toEqual([]);
    expect(state.savings).toEqual([]);
    expect(state.investments).toEqual([]);
    expect(state.cfg.categories.length).toBeGreaterThan(0);
  });

  it("returns every storage id and an empty metadata record", () => {
    const meta = {
      households: [{ id: "home" }, { id: "secondary" }],
      active: "home",
      preserved: true
    };

    expect(clearHouseholdsMeta(meta)).toEqual({
      householdIds: ["home", "secondary"],
      nextMeta: { households: [], active: null, preserved: true }
    });
  });
});
