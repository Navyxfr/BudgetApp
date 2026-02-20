export const sumRev = md => (md?.rev || []).reduce((s, r) => s + (r.amount || 0), 0);

export const revPerson = (md, pid) =>
  (md?.rev || []).filter(r => r.pid === pid).reduce((s, r) => s + (r.amount || 0), 0);

export const sumAid = md =>
  (md?.rev || []).filter(r => r.type === "aid").reduce((s, r) => s + (r.amount || 0), 0);

export const sumFC = md => (md?.charges || []).reduce((s, c) => s + (c.amount || 0), 0);

export const prorata = (md, persons) => {
  const adults = (persons || []).filter(p => (p.type || "adult") === "adult");
  const totalFc = sumFC(md);
  const aids = sumAid(md);
  const remaining = Math.max(0, totalFc - aids);
  if (adults.length === 0) return {};
  const splits = adults.map(p => ({ id: p.id, s: revPerson(md, p.id) }));
  const sumSplits = splits.reduce((s, x) => s + x.s, 0);
  if (sumSplits === 0) return Object.fromEntries(splits.map(x => [x.id, remaining / splits.length]));
  return Object.fromEntries(splits.map(x => [x.id, remaining * (x.s / sumSplits)]));
};

export const sumVarBudget = md => (md?.cb || []).reduce((s, b) => s + (b.budget || 0), 0);

export const sumSpent = (md, cid) =>
  (md?.exp || []).filter(e => !cid || e.cid === cid).reduce((s, e) => s + (e.amount || 0), 0);

export const personBalance = (md, pid) => {
  const rev = revPerson(md, pid);
  const alloc = md?.alloc?.[pid] || {};
  const sav = (alloc.sav || []).reduce((s, x) => s + (x.amount || 0), 0);
  const inv = (alloc.inv || []).reduce((s, x) => s + (x.amount || 0), 0);
  return rev - (alloc.fc || 0) - (alloc.vc || 0) - sav - inv;
};

export const savBalance = account =>
  Number(account?.openingBalance ?? account?.balance ?? 0) +
  (account?.movements || []).reduce((s, m) => s + (m.amount || 0), 0);

export function defaultMonth(k, state, deps) {
  const { uid, loanMonths, calcMP } = deps;
  const cats = (state?.cfg?.categories || []).filter(c => !c.ar);
  const ps = state?.cfg?.persons || [{ id: "A", name: "A", type: "adult" }];
  const adults = ps.filter(p => (p.type || "adult") === "adult");
  const months = state?.months || {};
  const sorted = Object.keys(months).filter(m => m < k).sort();
  const prev = sorted.length > 0 ? months[sorted[sorted.length - 1]] : null;

  if (prev && prev.ok) {
    return {
      ok: false,
      rev: (prev.rev || []).map(r => ({ ...r, id: uid() })),
      charges: (state?.loans || [])
        .filter(l => !l.ar)
        .map(l => {
          const m = loanMonths(l.s, l.e);
          return {
            id: uid(),
            name: l.name,
            amount: l.ac ? calcMP(l.cap, l.rate, m.t) : l.mp,
            freq: "monthly",
            lid: l.id,
            auto: true
          };
        })
        .concat((prev.charges || []).filter(c => !c.auto).map(c => ({ ...c, id: uid() }))),
      alloc: Object.fromEntries(ps.map(p => [p.id, { fc: 0, vc: 0, sav: [], inv: [] }])),
      cb: (prev.cb || []).map(b => ({ ...b })),
      exp: []
    };
  }

  return {
    ok: false,
    rev: adults.map(p => ({ id: uid(), label: "Salaire " + p.name, amount: 0, pid: p.id, type: "salary" })),
    charges: (state?.loans || [])
      .filter(l => !l.ar)
      .map(l => {
        const m = loanMonths(l.s, l.e);
        return {
          id: uid(),
          name: l.name,
          amount: l.ac ? calcMP(l.cap, l.rate, m.t) : l.mp,
          freq: "monthly",
          lid: l.id,
          auto: true
        };
      }),
    alloc: Object.fromEntries(ps.map(p => [p.id, { fc: 0, vc: 0, sav: [], inv: [] }])),
    cb: cats.map(c => ({ cid: c.id, budget: 0 })),
    exp: []
  };
}

export const getMonth = (state, key, deps) =>
  state?.months?.[key] || defaultMonth(key, state, deps);
