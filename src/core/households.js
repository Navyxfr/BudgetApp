import { defaultState } from "./defaults.js";

export function createBlankHouseholdState({ uid, colors } = {}) {
  return defaultState([], undefined, { uidFn: uid, colors });
}

export function clearHouseholdsMeta(meta) {
  return {
    householdIds: (meta?.households || []).map(household => household.id),
    nextMeta: { ...(meta || {}), households: [], active: null }
  };
}
