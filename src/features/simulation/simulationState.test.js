import { describe, expect, it } from "vitest";
import { ensureSimulationMonthShape, updateCategoryBudget } from "./simulationState.js";

describe("simulation state", () => {
  it("adds missing category budgets for legacy months without cb", () => {
    const month = { rev: [], charges: [] };
    const normalized = ensureSimulationMonthShape(month, [], [], [{ id: "food" }, { id: "fuel" }], () => "id");

    expect(normalized.cb).toEqual([{ cid: "food", budget: 0 }, { cid: "fuel", budget: 0 }]);
    expect(month.cb).toBeUndefined();
  });

  it("preserves existing budgets and fills only missing categories", () => {
    const normalized = ensureSimulationMonthShape(
      { cb: [{ cid: "food", budget: 450 }] }, [], [], [{ id: "food" }, { id: "fuel" }], () => "id"
    );
    expect(normalized.cb).toEqual([{ cid: "food", budget: 450 }, { cid: "fuel", budget: 0 }]);
  });

  it("updates safely even when the category budget array is absent", () => {
    expect(updateCategoryBudget(undefined, "food", 275)).toEqual([{ cid: "food", budget: 275 }]);
    expect(updateCategoryBudget([{ cid: "food", budget: 100 }], "food", 300)).toEqual([{ cid: "food", budget: 300 }]);
  });
});
