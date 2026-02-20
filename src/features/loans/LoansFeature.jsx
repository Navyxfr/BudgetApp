import React, { useState } from "react";
import { Plus, Edit3, Archive, Trash2, Landmark, Check } from "lucide-react";
import { addLoan, updateLoan, deleteLoan } from "../../store/actions.js";

export default function LoansFeature({
  S,
  dispatch,
  toast,
  loanMonths,
  calcMP,
  calcCRD,
  eur,
  pct,
  EmptyState,
  Card,
  Prog,
  Btn,
  Modal,
  Inp
}) {
  const [show, setShow] = useState(null);
  const [arcId, setArcId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: "", s: "", e: "", rate: "", cap: "" });
  const loans = S.loans.filter(l => !l.ar);

  const monthlyTotal = loans.reduce((acc, l) => {
    const m = loanMonths(l.s, l.e);
    return acc + calcMP(l.cap, l.rate, m.t);
  }, 0);

  const remainingTotal = loans.reduce((acc, l) => {
    const m = loanMonths(l.s, l.e);
    return acc + Math.max(0, calcCRD(l.cap, l.rate, m.t, m.e));
  }, 0);

  const doSave = () => {
    if (!form.name) return;
    const rate = parseFloat(form.rate) || 0;
    const cap = parseFloat(form.cap) || 0;
    const m = loanMonths(form.s, form.e);
    const mp = calcMP(cap, rate, m.t);
    if (show === "new") {
      dispatch(addLoan({ name: form.name, s: form.s, e: form.e, rate, cap, mp, ac: true, ar: false }));
    } else {
      dispatch(updateLoan(show, { name: form.name, s: form.s, e: form.e, rate, cap, mp }));
    }
    toast(show === "new" ? "Cree" : "Modifie");
    setShow(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>Synthese prets</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--bg2)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>Mensualites totales</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700 }}>{eur(monthlyTotal)}</p>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "var(--bg2)" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>Capital restant</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700 }}>{eur(remainingTotal)}</p>
          </div>
        </div>
      </Card>

      {loans.length === 0 ? (
        <EmptyState icon={Landmark} msg="Aucun pret" action="Ajouter" onAction={() => { setForm({ name: "", s: "", e: "", rate: "", cap: "" }); setShow("new"); }} />
      ) : (
        loans.map(l => {
          const m = loanMonths(l.s, l.e);
          const mp = calcMP(l.cap, l.rate, m.t);
          const crd = calcCRD(l.cap, l.rate, m.t, m.e);
          return (
            <Card key={l.id} p={18}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{l.name}</p>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { setForm({ name: l.name, s: l.s, e: l.e, rate: String(l.rate), cap: String(l.cap) }); setShow(l.id); }} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Edit3 size={14} color="var(--text3)" /></button>
                  <button onClick={() => setArcId(l.id)} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Archive size={14} color="var(--text3)" /></button>
                  <button onClick={() => setDelId(l.id)} style={{ width: 32, height: 32, borderRadius: 10, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={14} color="var(--red)" /></button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["Mensualite", "Echeances", "Capital restant", "Taux"].map((k, i) => {
                  const v = [eur(mp), m.r + "/" + m.t, eur(Math.max(0, crd)), l.rate + "%"][i];
                  return (
                    <div key={k} style={{ padding: 10, background: "var(--bg2)", borderRadius: "var(--r3)" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>{k}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "3px 0 0" }}>{v}</p>
                    </div>
                  );
                })}
              </div>
              {m.t > 0 && <div style={{ marginTop: 10 }}><Prog val={m.e} max={m.t} color="var(--purple)" /><p style={{ fontSize: 11, color: "var(--text3)", margin: "4px 0 0", textAlign: "right" }}>{pct((m.e / m.t) * 100)} rembourse</p></div>}
            </Card>
          );
        })
      )}

      <Btn v="secondary" full onClick={() => { setForm({ name: "", s: "", e: "", rate: "", cap: "" }); setShow("new"); }}><Plus size={16} />Nouveau pret</Btn>

      <Modal open={!!show} onClose={() => setShow(null)} title={show === "new" ? "Nouveau" : "Modifier"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Credit auto" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Inp label="Capital" suffix="EUR" type="number" inputMode="decimal" value={form.cap} onChange={e => setForm({ ...form, cap: e.target.value })} />
            <Inp label="Taux" suffix="%" type="number" inputMode="decimal" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Inp label="Debut" type="date" value={form.s} onChange={e => setForm({ ...form, s: e.target.value })} />
            <Inp label="Fin" type="date" value={form.e} onChange={e => setForm({ ...form, e: e.target.value })} />
          </div>
          {form.cap && form.s && form.e && (
            <div style={{ padding: "12px 16px", borderRadius: 14, background: "var(--green2)", display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={16} color="var(--green)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--green)" }}>
                Mensualite : {eur(calcMP(parseFloat(form.cap) || 0, parseFloat(form.rate) || 0, loanMonths(form.s, form.e).t))}
              </span>
            </div>
          )}
          {!(form.name.trim() && form.cap && form.s && form.e) && <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>Nom, capital, debut et fin requis.</p>}
          <Btn full disabled={!(form.name.trim() && form.cap && form.s && form.e)} onClick={doSave}>{show === "new" ? "Creer" : "Modifier"}</Btn>
          {show !== "new" && <Btn v="danger" full onClick={() => { setDelId(show); setShow(null); }}>Supprimer</Btn>}
        </div>
      </Modal>

      <Modal open={!!arcId} onClose={() => setArcId(null)} title="Confirmer">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text2)" }}>Archiver ce pret ?</p>
          <Btn full onClick={() => { dispatch(updateLoan(arcId, { ar: true })); toast("Archive"); setArcId(null); }}>Archiver</Btn>
        </div>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Confirmer">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text2)" }}>Supprimer definitivement ce pret ?</p>
          <Btn v="danger" full onClick={() => { dispatch(deleteLoan(delId)); toast("Supprime"); setDelId(null); }}>Supprimer</Btn>
        </div>
      </Modal>
    </div>
  );
}
