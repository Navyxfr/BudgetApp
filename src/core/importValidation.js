export const isObject = v => !!v && typeof v === "object" && !Array.isArray(v);

export const isValidHouseholdState = v =>
  isObject(v) &&
  isObject(v.cfg) &&
  Array.isArray(v.cfg.persons) &&
  Array.isArray(v.cfg.categories) &&
  isObject(v.months) &&
  Array.isArray(v.loans) &&
  Array.isArray(v.savings) &&
  Array.isArray(v.investments);

export const isValidBackupFile = v => {
  if (!isObject(v) || !isObject(v.meta) || !Array.isArray(v.meta.households) || !isObject(v.households)) return false;
  return v.meta.households.every(h => isObject(h) && typeof h.id === "string" && isValidHouseholdState(v.households[h.id]));
};

