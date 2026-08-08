const fallbackId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const emptyAllocation = persons =>
  Object.fromEntries(
    (persons || []).map(person => [person.id, { fc: 0, vc: 0, sav: [], inv: [] }])
  );

const isLoanActiveForMonth = (loan, monthKey) => {
  const start = String(loan?.s || "").slice(0, 7);
  const end = String(loan?.e || "").slice(0, 7);
  return (!start || start <= monthKey) && (!end || end >= monthKey);
};

const activeLoanCharges = (monthKey, state, deps) =>
  (state?.loans || [])
    .filter(loan => !loan.ar && isLoanActiveForMonth(loan, monthKey))
    .map(loan => {
      const duration = deps.loanMonths(loan.s, loan.e);
      return {
        id: deps.uid(),
        name: loan.name,
        amount: loan.ac ? deps.calcMP(loan.cap, loan.rate, duration.t) : loan.mp,
        freq: "monthly",
        lid: loan.id,
        auto: true
      };
    });

const baseMonth = (monthKey, state, deps, mode) => ({
  ok: false,
  monthKey,
  preparationMode: mode,
  createdAt: deps.now?.() || new Date().toISOString(),
  rev: (state?.cfg?.persons || [])
    .filter(person => (person.type || "adult") === "adult")
    .map(person => ({
      id: deps.uid(),
      label: `Salaire ${person.name}`,
      amount: 0,
      pid: person.id,
      type: "salary"
    })),
  charges: activeLoanCharges(monthKey, state, deps),
  alloc: emptyAllocation(state?.cfg?.persons || []),
  cb: (state?.cfg?.categories || [])
    .filter(category => !category.ar)
    .map(category => ({ cid: category.id, budget: 0 })),
  exp: []
});

export function createEmptyMonth(monthKey, state, dependencies) {
  const deps = { uid: fallbackId, ...dependencies };
  return baseMonth(monthKey, state, deps, "empty");
}

export function duplicateMonth(sourceMonthKey, targetMonthKey, state, dependencies) {
  const deps = { uid: fallbackId, ...dependencies };
  const source = state?.months?.[sourceMonthKey];
  if (!source) return createEmptyMonth(targetMonthKey, state, deps);

  const target = baseMonth(targetMonthKey, state, deps, "copied");
  return {
    ...target,
    copiedFrom: sourceMonthKey,
    rev: (source.rev || []).map(revenue => ({
      ...revenue,
      id: deps.uid(),
      createdAt: undefined,
      updatedAt: undefined
    })),
    charges: [
      ...target.charges,
      ...(source.charges || [])
        .filter(charge => !charge.auto && !charge.lid)
        .map(charge => ({
          ...charge,
          id: deps.uid(),
          createdAt: undefined,
          updatedAt: undefined
        }))
    ],
    cb: target.cb.map(categoryBudget => ({
      ...categoryBudget,
      budget:
        (source.cb || []).find(item => item.cid === categoryBudget.cid)?.budget || 0
    }))
  };
}

export const hasStoredMonth = (state, monthKey) =>
  Object.prototype.hasOwnProperty.call(state?.months || {}, monthKey);

export function getMonthStatus(month) {
  if (!month) return "missing";
  if (month.ok) return "completed";
  const hasPlanning =
    (month.rev || []).some(item => Number(item.amount || 0) > 0) ||
    (month.charges || []).some(item => !item.auto && Number(item.amount || 0) > 0) ||
    (month.cb || []).some(item => Number(item.budget || 0) > 0);
  return hasPlanning || (month.exp || []).length > 0 ? "prepared" : "empty";
}

export function listImportableMonths(state, targetMonthKey) {
  return Object.entries(state?.months || {})
    .filter(([monthKey, month]) =>
      monthKey !== targetMonthKey && ["prepared", "completed"].includes(getMonthStatus(month))
    )
    .map(([monthKey, month]) => ({ monthKey, status: getMonthStatus(month) }))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}
