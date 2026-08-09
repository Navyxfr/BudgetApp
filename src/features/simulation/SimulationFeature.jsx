import React, { useState } from "react";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { ensureSimulationMonthShape, updateCategoryBudget } from "./simulationState.js";

export default function SimulationFeature({
  S,
  cm,
  onSave,
  onClose,
  monthAggDeps,
  getMonth,
  sumRev,
  sumAid,
  sumFC,
  prorata,
  sumVarBudget,
  revPerson,
  monthLabel,
  uid,
  eur,
  AlertBanner,
  KPI,
  Card,
  Btn,
  Ico
}) {
  const ps = S.cfg.persons || [];
  const adults = ps.filter(p => (p.type || "adult") === "adult");
  const cats = (S.cfg.categories || []).filter(c => !c.ar);
  const savingsAccounts = (S.savings || []).filter(a => !a.ar);
  const investmentAccounts = (S.investments || []).filter(a => !a.ar);
  const personById = Object.fromEntries(ps.map(p => [p.id, p]));

  const [st, setSt] = useState(0);
  const [w, setW] = useState(() =>
    ensureSimulationMonthShape(getMonth(S, cm, monthAggDeps), adults, ps, cats, uid)
  );
  const STEPS = ["Revenus", "Charges", "Depenses", "Epargne", "Invest.", "Virements"];

  const tr = sumRev(w);
  const aids = sumAid(w);
  const tf = sumFC(w);
  const pr = prorata(w, ps);
  const tv = sumVarBudget(w);
  const rb = Object.fromEntries(ps.map(p => [p.id, revPerson(w, p.id)]));
  const vcPerAdult = adults.length > 0 ? tv / adults.length : tv;

  const balFor = pid => {
    const p = ps.find(x => x.id === pid);
    const isAdult = (p?.type || "adult") === "adult";
    const r = rb[pid] || 0;
    const savArr = w.alloc?.[pid]?.sav || [];
    const invArr = w.alloc?.[pid]?.inv || [];
    return (
      r -
      (isAdult ? pr[pid] || 0 : 0) -
      (isAdult ? vcPerAdult : 0) -
      savArr.reduce((s, x) => s + (x.amount || 0), 0) -
      invArr.reduce((s, x) => s + (x.amount || 0), 0)
    );
  };

  const setAlloc = (pid, key, accId, val) => {
    setW(prev => {
      const alloc = prev.alloc || {};
      const personAlloc = alloc[pid] || { fc: 0, vc: 0, sav: [], inv: [] };
      const arr = [...(personAlloc[key] || [])];
      const idx = arr.findIndex(x => x.accId === accId);
      if (idx >= 0) arr[idx] = { ...arr[idx], amount: val };
      else arr.push({ accId, amount: val });

      return {
        ...prev,
        alloc: {
          ...alloc,
          [pid]: {
            ...personAlloc,
            [key]: arr
          }
        }
      };
    });
  };

  const validate = () => {
    const final = {
      ...w,
      ok: true,
      alloc: Object.fromEntries(
        ps.map(p => {
          const isA = (p.type || "adult") === "adult";
          return [
            p.id,
            {
              fc: isA ? pr[p.id] || 0 : 0,
              vc: isA ? vcPerAdult : 0,
              sav: w.alloc?.[p.id]?.sav || [],
              inv: w.alloc?.[p.id]?.inv || []
            }
          ];
        })
      )
    };
    onSave(final);
  };

  const smallInput = {
    width: 88,
    background: "var(--bg2)",
    border: "1.5px solid transparent",
    borderRadius: 10,
    padding: "9px 10px",
    fontSize: 14,
    textAlign: "right",
    fontWeight: 600,
    color: "var(--text)",
    outline: "none"
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',system-ui,sans-serif", animation: "fadeIn .2s ease" }}>
      <div className="sa-top" style={{ padding: "14px 20px", borderBottom: "1px solid var(--sep)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button onClick={onClose} style={{ fontSize: 15, fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Annuler</button>
          <div style={{ textAlign: "center" }}><p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>{monthLabel(cm)}</p><p style={{ fontSize: 11, color: "var(--text3)", margin: "2px 0 0" }}>Simulation budget</p></div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ display: "flex", gap: 3 }}>{STEPS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= st ? "var(--accent)" : "var(--text4)", transition: "all .3s" }} />)}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <Card>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>Apercu simulation</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={{ padding: 8, borderRadius: 10, background: "var(--bg2)" }}><p style={{ fontSize: 10, color: "var(--text3)", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>Revenus</p><p style={{ fontSize: 14, margin: "3px 0 0", fontWeight: 700 }}>{eur(tr)}</p></div>
            <div style={{ padding: 8, borderRadius: 10, background: "var(--bg2)" }}><p style={{ fontSize: 10, color: "var(--text3)", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>Charges</p><p style={{ fontSize: 14, margin: "3px 0 0", fontWeight: 700 }}>{eur(tf)}</p></div>
            <div style={{ padding: 8, borderRadius: 10, background: "var(--bg2)" }}><p style={{ fontSize: 10, color: "var(--text3)", margin: 0, textTransform: "uppercase", fontWeight: 700 }}>Variable</p><p style={{ fontSize: 14, margin: "3px 0 0", fontWeight: 700 }}>{eur(tv)}</p></div>
          </div>
        </Card>

        {st === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>Revenus mensuels. Personnalisez les libelles et montants.</p>
            {(w.rev || []).map(r => (
              <div key={r.id} style={{ background: "var(--bg2)", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={r.label} onChange={e => setW(p => ({ ...p, rev: p.rev.map(x => (x.id === r.id ? { ...x, label: e.target.value } : x)) }))} style={{ flex: 1, background: "var(--card)", border: "1.5px solid var(--sep)", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontWeight: 600, color: "var(--text)", outline: "none" }} placeholder="Libelle" />
                  <button onClick={() => setW(p => ({ ...p, rev: p.rev.filter(x => x.id !== r.id) }))} style={{ width: 36, height: 36, borderRadius: 10, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}><Trash2 size={14} color="var(--red)" /></button>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" inputMode="decimal" value={r.amount || ""} onChange={e => setW(p => ({ ...p, rev: p.rev.map(x => (x.id === r.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x)) }))} placeholder="0" style={{ flex: 1, background: "var(--card)", border: "1.5px solid var(--sep)", borderRadius: 10, padding: "8px 12px", fontSize: 14, fontWeight: 600, color: "var(--text)", outline: "none", textAlign: "right" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)" }}>EUR</span>
                </div>
                {r.type !== "aid" && (
                  <div style={{ marginTop: 8 }}>
                    <select
                      value={r.pid || adults[0]?.id || ""}
                      onChange={e =>
                        setW(p => ({
                          ...p,
                          rev: p.rev.map(x => (x.id === r.id ? { ...x, pid: e.target.value || null } : x))
                        }))
                      }
                      style={{ width: "100%", background: "var(--card)", border: "1.5px solid var(--sep)", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 600, color: "var(--text)", outline: "none" }}
                    >
                      {adults.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn v="ghost" sm onClick={() => setW(p => ({ ...p, rev: [...p.rev, { id: uid(), label: "", amount: 0, pid: adults[0]?.id, type: "salary" }] }))}><Plus size={14} />Revenu perso</Btn>
              <Btn v="ghost" sm onClick={() => setW(p => ({ ...p, rev: [...p.rev, { id: uid(), label: "", amount: 0, pid: null, type: "aid" }] }))}><Plus size={14} />Aide / Allocation</Btn>
            </div>
          </div>
        )}

        {st === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 4px" }}>Charges du compte commun. Repartition au prorata.</p>
            {[["Total charges", eur(tf), true], ["Aides (PAJE+CMG)", "-" + eur(aids), false, "var(--green)"], ...adults.map(p => ["Part " + p.name, eur(pr[p.id] || 0)])].map(([l, v, b, c], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span style={{ fontSize: 14, color: "var(--text2)" }}>{l}</span><span style={{ fontSize: 14, fontWeight: b ? 700 : 600, color: c || "var(--text)" }}>{v}</span></div>
            ))}
          </div>
        )}

        {st === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 4px" }}>Budget mensuel par categorie.</p>
            {cats.map(c => {
              const b = (w.cb || []).find(x => x.cid === c.id);
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: c.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={c.icon} size={14} color={c.color} /></div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", flex: 1 }}>{c.name}</span>
                  <input type="number" inputMode="decimal" value={b?.budget || ""} onChange={e => {
                    const budget = Number.parseFloat(e.currentTarget.value) || 0;
                    setW(p => ({ ...p, cb: updateCategoryBudget(p.cb, c.id, budget) }));
                  }} placeholder="0" style={smallInput} />
                </div>
              );
            })}
          </div>
        )}

        {st === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 4px" }}>Chaque adulte peut verser sur n'importe quel compte epargne (enfant/adulte).</p>
            {adults.map(contributor => (
              <div key={contributor.id}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", margin: "0 0 8px" }}>{contributor.name} contribue</p>
                {savingsAccounts.map(acc => {
                  const owner = personById[acc.pid];
                  const ex = (w.alloc?.[contributor.id]?.sav || []).find(x => x.accId === acc.id);
                  return (
                    <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, flex: 1 }}>{acc.name}{owner ? <span style={{ color: "var(--text3)", fontSize: 12 }}> · {owner.name}</span> : null}</span>
                      <input type="number" inputMode="decimal" value={ex?.amount || ""} placeholder="0" onChange={e => setAlloc(contributor.id, "sav", acc.id, parseFloat(e.target.value) || 0)} style={smallInput} />
                    </div>
                  );
                })}
                {savingsAccounts.length === 0 && <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>Aucun compte</p>}
              </div>
            ))}
          </div>
        )}

        {st === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "var(--text3)", margin: "0 0 4px" }}>Chaque adulte peut verser sur n'importe quel compte investissement.</p>
            {adults.map(contributor => (
              <div key={contributor.id}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", margin: "0 0 8px" }}>{contributor.name} contribue</p>
                {investmentAccounts.map(acc => {
                  const owner = personById[acc.pid];
                  const ex = (w.alloc?.[contributor.id]?.inv || []).find(x => x.accId === acc.id);
                  return (
                    <div key={acc.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, flex: 1 }}>{acc.name}{owner ? <span style={{ color: "var(--text3)", fontSize: 12 }}> · {owner.name}</span> : null}</span>
                      <input type="number" inputMode="decimal" value={ex?.amount || ""} placeholder="0" onChange={e => setAlloc(contributor.id, "inv", acc.id, parseFloat(e.target.value) || 0)} style={smallInput} />
                    </div>
                  );
                })}
                {investmentAccounts.length === 0 && <p style={{ fontSize: 13, color: "var(--text3)", margin: 0 }}>Aucun compte</p>}
              </div>
            ))}
          </div>
        )}

        {st === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {adults.some(p => balFor(p.id) < 0) && <AlertBanner type="danger" msg={"Deficit : " + adults.filter(p => balFor(p.id) < 0).map(p => p.name).join(", ")} />}
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px" }}>Virements a effectuer</p>
              {adults.map(p => {
                const hasSav = (w.alloc?.[p.id]?.sav || []).some(x => x.amount > 0);
                const hasInv = (w.alloc?.[p.id]?.inv || []).some(x => x.amount > 0);
                if (!hasSav && !hasInv) return null;
                return (
                  <div key={p.id} style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 6px" }}>{p.name}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 12, borderLeft: "2px solid var(--accent)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text2)" }}>{"-> "}Compte charges fixes</span><span style={{ fontWeight: 700, color: "var(--text)" }}>{eur(pr[p.id] || 0)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text2)" }}>{"-> "}Pot depenses variables</span><span style={{ fontWeight: 700, color: "var(--text)" }}>{eur(vcPerAdult)}</span></div>
                      {(w.alloc?.[p.id]?.sav || []).filter(x => x.amount > 0).map(x => {
                        const acc = S.savings.find(a => a.id === x.accId);
                        const owner = acc ? personById[acc.pid] : null;
                        return <div key={x.accId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text2)" }}>{"-> "}{acc?.name || "Epargne"}{owner ? ` (${owner.name})` : ""}</span><span style={{ fontWeight: 700, color: "var(--green)" }}>{eur(x.amount)}</span></div>;
                      })}
                      {(w.alloc?.[p.id]?.inv || []).filter(x => x.amount > 0).map(x => {
                        const acc = S.investments.find(a => a.id === x.accId);
                        const owner = acc ? personById[acc.pid] : null;
                        return <div key={x.accId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: "var(--text2)" }}>{"-> "}{acc?.name || "Invest."}{owner ? ` (${owner.name})` : ""}</span><span style={{ fontWeight: 700, color: "var(--blue)" }}>{eur(x.amount)}</span></div>;
                      })}
                    </div>
                  </div>
                );
              })}
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: adults.length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
              {adults.map(p => <KPI key={p.id} label={"Reste a vivre " + p.name} value={eur(balFor(p.id))} color={balFor(p.id) >= 0 ? "var(--green)" : "var(--red)"} />)}
            </div>
            <Btn v="muted" full onClick={() => setSt(0)}><RotateCcw size={14} />Recommencer</Btn>
          </div>
        )}
      </div>

      <div className="sa-onb-bot" style={{ padding: "14px 20px", borderTop: "1px solid var(--sep)", display: "flex", gap: 12, background: "var(--bg)" }}>
        {st > 0 && <Btn v="muted" full onClick={() => setSt(st - 1)}>Precedent</Btn>}
        {st < 5 ? <Btn full onClick={() => setSt(st + 1)}>Suivant</Btn> : <Btn full onClick={validate}><Check size={16} />Enregistrer</Btn>}
      </div>
    </div>
  );
}
