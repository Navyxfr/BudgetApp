const deepClone = value => {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

export function ensureSimulationMonthShape(monthData, adults, persons, categories, uid) {
  const next = deepClone(monthData || {});
  next.rev = Array.isArray(next.rev) ? next.rev : [];
  next.cb = Array.isArray(next.cb) ? next.cb : [];
  next.alloc = next.alloc && typeof next.alloc === "object" ? next.alloc : {};

  for (const category of categories || []) {
    if (!next.cb.some(item => item?.cid === category.id)) {
      next.cb.push({ cid: category.id, budget: 0 });
    }
  }

  for (const person of persons || []) {
    if (!next.alloc[person.id]) next.alloc[person.id] = { fc: 0, vc: 0, sav: [], inv: [] };
  }

  const existingRevPids = new Set(
    next.rev
      .filter(revenue => (revenue?.type || "salary") !== "aid" && revenue?.pid)
      .map(revenue => revenue.pid)
  );
  for (const adult of adults || []) {
    if (!existingRevPids.has(adult.id)) {
      next.rev.push({ id: uid(), label: "Salaire " + adult.name, amount: 0, pid: adult.id, type: "salary" });
    }
  }

  return next;
}

export function updateCategoryBudget(categoryBudgets, categoryId, budget) {
  const current = Array.isArray(categoryBudgets) ? categoryBudgets : [];
  const normalizedBudget = Number.isFinite(Number(budget)) ? Number(budget) : 0;
  const exists = current.some(item => item?.cid === categoryId);
  if (!exists) return [...current, { cid: categoryId, budget: normalizedBudget }];
  return current.map(item => item?.cid === categoryId ? { ...item, budget: normalizedBudget } : item);
}
