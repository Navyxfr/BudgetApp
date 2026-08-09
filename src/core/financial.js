const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// mode="budget": annual/quaterly are normalized monthly (forecast view)
// mode="cashflow": same behavior for now until scheduling metadata exists on charges
export const toMonthlyCharge = (c, { mode = "budget" } = {}) => {
  void mode;
  const amount = Number(c?.amount || 0);
  const freq = c?.freq || "monthly";
  if (freq === "annual") return amount / 12;
  if (freq === "quarterly") return amount / 3;
  return amount;
};

export const sumFC = md => (md?.charges || []).reduce((s, c) => s + toMonthlyCharge(c), 0);
export const sumRev = md => (md?.rev || []).reduce((s, r) => s + (r.amount || 0), 0);
export const revPerson = (md, pid) => (md?.rev || []).filter(r => r.pid === pid).reduce((s, r) => s + (r.amount || 0), 0);
export const sumAid = md => (md?.rev || []).filter(r => r.type === "aid").reduce((s, r) => s + (r.amount || 0), 0);
export const sumVarBudget = md => (Array.isArray(md?.cb) ? md.cb : []).reduce((sum, item) => {
  const budget = Number(item?.budget);
  return sum + (Number.isFinite(budget) ? budget : 0);
}, 0);
export const sumSpent = (md, cid) => (md?.exp || []).filter(e => !cid || e.cid === cid).reduce((s, e) => s + (e.amount || 0), 0);

export const prorata = (md, persons) => {
  const adults = (persons || []).filter(p => (p.type || "adult") === "adult");
  const totalFixed = sumFC(md);
  const aid = sumAid(md);
  const remaining = Math.max(0, totalFixed - aid);
  if (adults.length === 0) return {};
  const salaries = adults.map(p => ({ id: p.id, s: revPerson(md, p.id) }));
  const totalSalary = salaries.reduce((s, x) => s + x.s, 0);
  if (totalSalary === 0) return Object.fromEntries(salaries.map(x => [x.id, remaining / salaries.length]));
  return Object.fromEntries(salaries.map(x => [x.id, remaining * (x.s / totalSalary)]));
};

export const personBalance = (md, pid) => {
  const revenue = revPerson(md, pid);
  const a = md?.alloc?.[pid] || {};
  const sav = (a.sav || []).reduce((s, x) => s + (x.amount || 0), 0);
  const inv = (a.inv || []).reduce((s, x) => s + (x.amount || 0), 0);
  return revenue - (a.fc || 0) - (a.vc || 0) - sav - inv;
};

const movementSignedAmount = movement => {
  if (movement?.deleted) return 0;
  const amount = Number(movement?.amount || 0);
  if (movement?.type === "debit") return -Math.abs(amount);
  if (movement?.type === "credit") return Math.abs(amount);
  return amount; // backward compatibility for legacy signed movements
};

export const savBalance = account =>
  Number(account?.openingBalance ?? account?.balance ?? 0) +
  (account?.movements || []).reduce((s, m) => s + movementSignedAmount(m), 0);

export const calcMonthlyPayment = (capital, rate, months) => {
  const C = Number(capital || 0);
  const t = Number(rate || 0);
  const n = Number(months || 0);
  if (!C || !n || n <= 0) return 0;
  if (!t || t <= 0) return C / n;
  const r = t / 100 / 12;
  return (C * r) / (1 - Math.pow(1 + r, -n));
};

export const calcRemainingDebt = (capital, rate, months, elapsedMonths) => {
  const C = Number(capital || 0);
  const t = Number(rate || 0);
  const n = Number(months || 0);
  const e = Number(elapsedMonths || 0);
  if (!C || !n) return 0;
  if (e >= n) return 0;
  if (!t || t <= 0) return Math.max(0, C - (C / n) * e);
  const r = t / 100 / 12;
  const m = calcMonthlyPayment(C, t, n);
  return Math.max(0, C * Math.pow(1 + r, e) - (m * (Math.pow(1 + r, e) - 1)) / r);
};

export const loanMonths = (startDate, endDate, now = new Date()) => {
  if (!startDate || !endDate) return { t: 0, e: 0, r: 0 };
  const sd = new Date(startDate);
  const ed = new Date(endDate);
  const total = Math.max(0, (ed.getFullYear() - sd.getFullYear()) * 12 + (ed.getMonth() - sd.getMonth()));
  const elapsedRaw = (now.getFullYear() - sd.getFullYear()) * 12 + (now.getMonth() - sd.getMonth());
  const elapsed = clamp(elapsedRaw, 0, total);
  return { t: total, e: elapsed, r: total - elapsed };
};

export const amortization = {
  calcMonthlyPayment,
  calcRemainingDebt,
  loanMonths
};

export const computeMonthlyProjection = md => ({
  revenues: sumRev(md),
  fixedCharges: sumFC(md),
  variableSpent: sumSpent(md),
  net: sumRev(md) - (sumFC(md) + sumSpent(md))
});

export const computeCashFlow = input => {
  if (!input) return 0;
  if (Array.isArray(input)) return input.filter(a => !a?.deleted).reduce((s, a) => s + savBalance(a), 0);

  // Savings account shape
  if (input.openingBalance != null || input.balance != null || Array.isArray(input.movements)) {
    if (input.deleted) return 0;
    return savBalance(input);
  }

  // Household-like shape
  if (Array.isArray(input.savings)) {
    return input.savings.filter(a => !a?.deleted && !a?.ar).reduce((s, a) => s + savBalance(a), 0);
  }

  // Fallback to monthly budget net cash-flow.
  if (Array.isArray(input.rev) || Array.isArray(input.charges) || Array.isArray(input.exp)) {
    return computeMonthlyProjection(input).net;
  }

  return 0;
};

export const projections = {
  netMonthly: md => computeMonthlyProjection(md).net,
  annualizedNetFromMonth: md => computeMonthlyProjection(md).net * 12
};

export const ratios = {
  savingsRate: md => {
    const rev = sumRev(md);
    if (!rev) return 0;
    const spent = sumFC(md) + sumSpent(md);
    return clamp(((rev - spent) / rev) * 100, -999, 999);
  },
  debtToIncome: (fixedCharges, income) => {
    const fc = Number(fixedCharges || 0);
    const inc = Number(income || 0);
    if (!inc) return 0;
    return clamp((fc / inc) * 100, 0, 999);
  }
};
