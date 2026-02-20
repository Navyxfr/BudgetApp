import React, { useMemo, useState } from "react";
import { Check, Landmark, PiggyBank, Plus, Trash2, TrendingUp, Users, Baby } from "lucide-react";

export default function OnboardingFeature({
  onDone,
  defaultCats,
  defaultState,
  COLORS,
  FREQ,
  SAV_TYPES,
  INV_TYPES,
  CSS,
  SegTabs,
  Inp,
  Sel,
  Btn,
  Card,
  Row,
  Ico,
  loanMonths,
  calcMP,
  eur,
  uid,
  defaultMonth,
  monthAggDeps
}) {
  const [step, setStep] = useState(0);
  const [people, setPeople] = useState([{ id: "A", name: "", type: "adult" }]);

  const [charges, setCharges] = useState([]);
  const [chgForm, setChgForm] = useState({ name: "", amount: "", freq: "monthly" });

  const [catList, setCatList] = useState(defaultCats(uid, COLORS));
  const [catForm, setCatForm] = useState({ name: "", icon: "ShoppingCart", color: COLORS[0] });
  const [showCatForm, setShowCatForm] = useState(false);

  const [loans, setLoans] = useState([]);
  const [loanForm, setLoanForm] = useState({ name: "Credit immobilier", cap: "", rate: "3.5", s: "2024-01-01", e: "2048-12-31" });

  const [savAccounts, setSavAccounts] = useState([]);
  const [savForm, setSavForm] = useState({ name: "", type: "livret", pid: "A", bal: "" });

  const [invAccounts, setInvAccounts] = useState([]);
  const [invForm, setInvForm] = useState({ name: "", type: "pea", pid: "A", bal: "" });

  const STEPS = 6;
  const stepTitles = ["Foyer", "Charges fixes", "Categories", "Prets", "Epargne", "Investissements"];

  const personOptions = useMemo(
    () => people.map(p => ({ v: p.id, l: `${p.name || p.id} (${p.type === "child" ? "Enfant" : "Adulte"})` })),
    [people]
  );

  const addPerson = type => {
    const id = String.fromCharCode(65 + people.length);
    const next = [...people, { id, name: "", type }];
    setPeople(next);
    if (!savForm.pid) setSavForm(p => ({ ...p, pid: id }));
    if (!invForm.pid) setInvForm(p => ({ ...p, pid: id }));
  };

  const removePerson = idx => {
    const target = people[idx];
    const next = people.filter((_, i) => i !== idx);
    const fallbackPid = next[0]?.id || "A";
    setPeople(next);
    setSavAccounts(prev => prev.map(a => (a.pid === target.id ? { ...a, pid: fallbackPid } : a)));
    setInvAccounts(prev => prev.map(a => (a.pid === target.id ? { ...a, pid: fallbackPid } : a)));
    setSavForm(p => ({ ...p, pid: p.pid === target.id ? fallbackPid : p.pid }));
    setInvForm(p => ({ ...p, pid: p.pid === target.id ? fallbackPid : p.pid }));
  };

  const finish = () => {
    const normalizedPeople = people.map((p, i) => ({
      id: p.id,
      name: p.name?.trim() || `Personne ${String.fromCharCode(65 + i)}`,
      type: p.type || "adult"
    }));

    const hasAdult = normalizedPeople.some(p => p.type === "adult");
    if (!hasAdult) return;

    const st = defaultState(normalizedPeople, catList, { uidFn: uid, colors: COLORS });

    loans.forEach(ln => {
      const m = loanMonths(ln.s, ln.e);
      st.loans.push({
        id: uid(),
        name: ln.name,
        s: ln.s,
        e: ln.e,
        rate: parseFloat(ln.rate) || 0,
        cap: parseFloat(ln.cap) || 0,
        mp: calcMP(parseFloat(ln.cap) || 0, parseFloat(ln.rate) || 0, m.t),
        ac: true,
        ar: false
      });
    });

    savAccounts.forEach(sv => {
      st.savings.push({
        id: uid(),
        name: sv.name,
        type: sv.type,
        pid: sv.pid,
        openingBalance: parseFloat(sv.bal) || 0,
        movements: [],
        ar: false,
        objectives: []
      });
    });

    invAccounts.forEach(iv => {
      const value = parseFloat(iv.bal) || 0;
      st.investments.push({
        id: uid(),
        name: iv.name,
        type: iv.type,
        pid: iv.pid,
        snapshots: value > 0 ? [{ date: new Date().toISOString().slice(0, 7), value }] : [],
        ar: false
      });
    });

    const firstKey = new Date().toISOString().slice(0, 7);
    const dm = defaultMonth(firstKey, st, monthAggDeps);
    dm.charges = [...dm.charges, ...charges.map(c => ({ id: uid(), name: c.name, amount: parseFloat(c.amount) || 0, freq: c.freq, auto: false }))];
    st.months[firstKey] = dm;

    onDone(st);
  };

  const addCharge = () => {
    const a = parseFloat(String(chgForm.amount).replace(",", "."));
    if (!chgForm.name || !a) return;
    setCharges([...charges, { id: uid(), name: chgForm.name, amount: a, freq: chgForm.freq }]);
    setChgForm({ name: "", amount: "", freq: "monthly" });
  };

  const addCat = () => {
    if (!catForm.name) return;
    setCatList([...catList, { id: uid(), name: catForm.name, icon: catForm.icon, color: catForm.color, o: catList.length }]);
    setCatForm({ name: "", icon: "ShoppingCart", color: COLORS[catList.length % COLORS.length] });
    setShowCatForm(false);
  };

  const addLoan = () => {
    const c = parseFloat(String(loanForm.cap).replace(",", "."));
    if (!loanForm.name || !c) return;
    setLoans([...loans, { ...loanForm, cap: c }]);
    setLoanForm({ name: "", cap: "", rate: "3.5", s: "2024-01-01", e: "2048-12-31" });
  };

  const addSav = () => {
    if (!savForm.name || !savForm.pid) return;
    setSavAccounts([...savAccounts, { ...savForm }]);
    setSavForm({ name: "", type: "livret", pid: people[0]?.id || "A", bal: "" });
  };

  const addInv = () => {
    if (!invForm.name || !invForm.pid) return;
    setInvAccounts([...invAccounts, { ...invForm }]);
    setInvForm({ name: "", type: "pea", pid: people[0]?.id || "A", bal: "" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif", position: "relative" }}>
      <style>{CSS}</style>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(620px 280px at 0% 0%, rgba(195,110,60,.16), transparent 62%),radial-gradient(680px 320px at 100% 0%, rgba(63,121,180,.13), transparent 58%)" }} />
      <div className="sa-top" style={{ padding: "16px 20px", borderBottom: "1px solid var(--sep)", backdropFilter: "blur(10px)", background: "color-mix(in srgb, var(--bg) 90%, transparent)", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 60 }}>{step > 0 && <button onClick={() => setStep(step - 1)} style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Retour</button>}</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>{stepTitles[step]}</p>
          <div style={{ width: 60, textAlign: "right" }}><span style={{ fontSize: 12, color: "var(--text3)" }}>{step + 1}/{STEPS}</span></div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>{Array.from({ length: STEPS }).map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--accent)" : "var(--text4)", transition: "all .3s" }} />)}</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 140px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 1 }}>
        <Card p={18}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>
            Assistant de configuration
          </p>
          <p style={{ fontSize: 14, color: "var(--text2)", margin: 0, lineHeight: 1.5 }}>
            Configure ton foyer, tes categories et tes comptes en quelques etapes. Tu pourras tout modifier ensuite dans les reglages.
          </p>
        </Card>
        {step === 0 && (
          <>
            <Card>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 6px" }}>Composition du foyer</p>
              <p style={{ fontSize: 14, color: "var(--text2)", margin: 0 }}>Ajoute adultes et enfants. Les comptes pourront etre rattaches a chacun.</p>
            </Card>
            {people.map((p, i) => (
              <Card key={p.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: p.type === "child" ? "var(--orange2)" : "var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p.type === "child" ? <Baby size={16} color="var(--orange)" /> : <Users size={16} color="var(--accent)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Inp label="Nom" value={p.name} onChange={e => setPeople(prev => prev.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder={p.type === "child" ? "Ex: Emma" : "Ex: Thomas"} />
                  </div>
                  {people.length > 1 && (
                    <button onClick={() => removePerson(i)} style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "var(--red2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Trash2 size={12} color="var(--red)" />
                    </button>
                  )}
                </div>
                <SegTabs items={[{ v: "adult", l: "Adulte" }, { v: "child", l: "Enfant" }]} active={p.type} onChange={v => setPeople(prev => prev.map((x, idx) => idx === i ? { ...x, type: v } : x))} />
              </Card>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn v="secondary" full onClick={() => addPerson("adult")}><Plus size={14} />Ajouter adulte</Btn>
              <Btn v="secondary" full onClick={() => addPerson("child")}><Plus size={14} />Ajouter enfant</Btn>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            {charges.length > 0 && <Card p={0}><div style={{ padding: "4px 16px" }}>{charges.map((c, i) => <Row key={c.id} left={c.name} sub={FREQ.find(x => x.v === c.freq)?.l} right={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{eur(c.amount)}</span><button onClick={() => setCharges(charges.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button></div>} />)}</div></Card>}
            <div style={{ background: "var(--bg2)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp label="Nom" value={chgForm.name} onChange={e => setChgForm({ ...chgForm, name: e.target.value })} placeholder="Ex: Loyer" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Montant" suffix="EUR" type="number" inputMode="decimal" value={chgForm.amount} onChange={e => setChgForm({ ...chgForm, amount: e.target.value })} />
                <Sel label="Frequence" options={FREQ} value={chgForm.freq} onChange={e => setChgForm({ ...chgForm, freq: e.target.value })} />
              </div>
              <Btn full onClick={addCharge}><Plus size={14} />Ajouter</Btn>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Card p={0}><div style={{ padding: "4px 16px" }}>{catList.map((c, i) => <Row key={c.id} icon={<Ico name={c.icon} size={15} color={c.color} />} iconBg={c.color + "12"} left={c.name} right={<button onClick={() => setCatList(catList.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button>} />)}</div></Card>
            {showCatForm ? (
              <div style={{ background: "var(--bg2)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                <Inp label="Nom" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Ex: Restaurants" />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{COLORS.map(co => <div key={co} onClick={() => setCatForm({ ...catForm, color: co })} style={{ width: 28, height: 28, borderRadius: 8, background: co, cursor: "pointer", border: catForm.color === co ? "3px solid var(--text)" : "3px solid transparent" }} />)}</div>
                <div style={{ display: "flex", gap: 8 }}><Btn full onClick={addCat}>Ajouter</Btn><Btn v="muted" full onClick={() => setShowCatForm(false)}>Annuler</Btn></div>
              </div>
            ) : (
              <Btn v="ghost" sm onClick={() => setShowCatForm(true)}><Plus size={14} />Nouvelle categorie</Btn>
            )}
          </>
        )}

        {step === 3 && (
          <>
            {loans.length > 0 && <Card p={0}><div style={{ padding: "4px 16px" }}>{loans.map((ln, i) => { const m = loanMonths(ln.s, ln.e); return <Row key={i} icon={<Landmark size={15} color="var(--purple)" />} iconBg="var(--purple2)" left={ln.name} sub={eur(calcMP(parseFloat(ln.cap) || 0, parseFloat(ln.rate) || 0, m.t)) + "/mois"} right={<button onClick={() => setLoans(loans.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button>} />; })}</div></Card>}
            <div style={{ background: "var(--bg2)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp label="Nom" value={loanForm.name} onChange={e => setLoanForm({ ...loanForm, name: e.target.value })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Capital" suffix="EUR" type="number" inputMode="decimal" value={loanForm.cap} onChange={e => setLoanForm({ ...loanForm, cap: e.target.value })} />
                <Inp label="Taux" suffix="%" type="number" inputMode="decimal" step="0.01" value={loanForm.rate} onChange={e => setLoanForm({ ...loanForm, rate: e.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Debut" type="date" value={loanForm.s} onChange={e => setLoanForm({ ...loanForm, s: e.target.value })} />
                <Inp label="Fin" type="date" value={loanForm.e} onChange={e => setLoanForm({ ...loanForm, e: e.target.value })} />
              </div>
              <Btn full onClick={addLoan}><Plus size={14} />Ajouter</Btn>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            {savAccounts.length > 0 && <Card p={0}><div style={{ padding: "4px 16px" }}>{savAccounts.map((sv, i) => <Row key={i} icon={<PiggyBank size={15} color="var(--green)" />} iconBg="var(--green2)" left={sv.name} sub={`${SAV_TYPES.find(x => x.v === sv.type)?.l} · ${personOptions.find(p=>p.v===sv.pid)?.l||sv.pid}`} right={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{sv.bal ? eur(parseFloat(sv.bal)) : ""}</span><button onClick={() => setSavAccounts(savAccounts.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button></div>} />)}</div></Card>}
            <div style={{ background: "var(--bg2)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp label="Nom" value={savForm.name} onChange={e => setSavForm({ ...savForm, name: e.target.value })} placeholder="Ex: Livret A" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Solde" suffix="EUR" type="number" inputMode="decimal" value={savForm.bal} onChange={e => setSavForm({ ...savForm, bal: e.target.value })} />
                <Sel label="Type" options={SAV_TYPES} value={savForm.type} onChange={e => setSavForm({ ...savForm, type: e.target.value })} />
              </div>
              <Sel label="Proprietaire" options={personOptions} value={savForm.pid} onChange={e => setSavForm({ ...savForm, pid: e.target.value })} />
              <Btn full onClick={addSav}><Plus size={14} />Ajouter</Btn>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            {invAccounts.length > 0 && <Card p={0}><div style={{ padding: "4px 16px" }}>{invAccounts.map((iv, i) => <Row key={i} icon={<TrendingUp size={15} color="var(--blue)" />} iconBg="var(--blue2)" left={iv.name} sub={`${INV_TYPES.find(x => x.v === iv.type)?.l} · ${personOptions.find(p=>p.v===iv.pid)?.l||iv.pid}`} right={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700 }}>{iv.bal ? eur(parseFloat(iv.bal)) : ""}</span><button onClick={() => setInvAccounts(invAccounts.filter((_, j) => j !== i))} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button></div>} />)}</div></Card>}
            <div style={{ background: "var(--bg2)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <Inp label="Nom" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} placeholder="Ex: PEA Boursorama" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Valeur" suffix="EUR" type="number" inputMode="decimal" value={invForm.bal} onChange={e => setInvForm({ ...invForm, bal: e.target.value })} />
                <Sel label="Type" options={INV_TYPES} value={invForm.type} onChange={e => setInvForm({ ...invForm, type: e.target.value })} />
              </div>
              <Sel label="Proprietaire" options={personOptions} value={invForm.pid} onChange={e => setInvForm({ ...invForm, pid: e.target.value })} />
              <Btn full onClick={addInv}><Plus size={14} />Ajouter</Btn>
            </div>
          </>
        )}
      </div>

      <div className="sa-onb-bot" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30, padding: "16px 28px", background: "color-mix(in srgb, var(--bg) 90%, transparent)", backdropFilter: "blur(10px)", borderTop: "1px solid var(--sep)" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {step > 0 && step < STEPS - 1 && <Btn v="muted" full onClick={() => setStep(step + 1)}>Passer</Btn>}
          {step < STEPS - 1 ? <Btn full onClick={() => setStep(step + 1)}>Continuer</Btn> : <Btn full onClick={finish}><Check size={18} />Commencer</Btn>}
        </div>
      </div>
    </div>
  );
}
