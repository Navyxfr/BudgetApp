import React, { useState } from "react";
import { Plus, Edit3, Archive, Trash2 } from "lucide-react";
import {
  addInvestmentAccount,
  updateInvestmentAccount,
  addInvestmentSnapshot,
  archiveInvestmentAccount,
  deleteInvestmentAccount
} from "../../store/actions.js";

export default function InvestmentsFeature({
  S,
  ps,
  dispatch,
  toast,
  nowKey,
  INV_TYPES,
  eur,
  KPI,
  Card,
  Btn,
  Modal,
  Inp,
  Sel,
  ConfirmDialog
}) {
  const [show, setShow] = useState(null);
  const [snapId, setSnapId] = useState(null);
  const [snapVal, setSnapVal] = useState("");
  const [arcId, setArcId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "pea", pid: ps[0]?.id || "A", val: "" });

  const accs = S.investments.filter(a => !a.ar);
  const total = accs.reduce((s, a) => s + ((a.snapshots || []).slice(-1)[0]?.value || 0), 0);

  const doSave = () => {
    if (!form.name) return;
    const nv = parseFloat(String(form.val).replace(",", ".")) || 0;
    if (show === "new") {
      const snaps = nv > 0 ? [{ date: nowKey(), value: nv }] : [];
      dispatch(addInvestmentAccount({ name: form.name, type: form.type, pid: form.pid, snapshots: snaps, ar: false }));
    } else {
      const a = S.investments.find(x => x.id === show);
      if (a) {
        const cur = (a.snapshots || []).slice(-1)[0]?.value || 0;
        let snapshots = a.snapshots || [];
        if (nv !== cur) {
          const last = snapshots.findIndex(x => x.date === nowKey());
          if (last >= 0) {
            snapshots = snapshots.map((s, idx) => (idx === last ? { ...s, value: nv } : s));
          } else {
            snapshots = [...snapshots, { date: nowKey(), value: nv }];
          }
        }
        dispatch(updateInvestmentAccount(show, { name: form.name, type: form.type, pid: form.pid, snapshots }));
      }
    }
    toast(show === "new" ? "Cree" : "Modifie");
    setShow(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>Synthese investissements</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <KPI label="Total" value={eur(total)} color="var(--blue)" />
          <KPI label="Comptes actifs" value={String(accs.length)} />
        </div>
      </Card>
      {accs.map(a => {
        const v = (a.snapshots || []).slice(-1)[0]?.value || 0;
        const pv = (a.snapshots || []).slice(-2, -1)[0]?.value;
        const d = pv != null ? v - pv : null;
        const pn = ps.find(p => p.id === a.pid);
        return (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{a.name}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--bg2)", color: "var(--text2)" }}>{INV_TYPES.find(t => t.v === a.type)?.l}</span>
                  {pn && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--blue2)", color: "var(--blue)" }}>{pn.name}</span>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>{eur(v)}</p>
                {d != null && <p style={{ fontSize: 12, fontWeight: 600, color: d >= 0 ? "var(--green)" : "var(--red)", margin: 0 }}>{d >= 0 ? "+" : ""}{eur(d)}</p>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Btn sm v="secondary" onClick={() => setSnapId(a.id)}><Plus size={13} />Maj valeur</Btn>
              <Btn sm v="ghost" onClick={() => { const cv = (a.snapshots || []).slice(-1)[0]?.value || 0; setForm({ name: a.name, type: a.type, pid: a.pid, val: cv ? String(cv) : "" }); setShow(a.id); }}><Edit3 size={13} /></Btn>
              <Btn sm v="ghost" onClick={() => setArcId(a.id)}><Archive size={13} /></Btn>
              <Btn sm v="danger" onClick={() => setDelId(a.id)}><Trash2 size={13} /></Btn>
            </div>
          </Card>
        );
      })}

      <Btn v="secondary" full onClick={() => { setForm({ name: "", type: "pea", pid: ps[0]?.id || "A", val: "" }); setShow("new"); }}><Plus size={16} />Nouveau</Btn>

      <Modal open={!!show} onClose={() => setShow(null)} title={show === "new" ? "Nouveau" : "Modifier"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Inp label="Valeur actuelle" suffix="EUR" type="number" inputMode="decimal" value={form.val} onChange={e => setForm({ ...form, val: e.target.value })} placeholder="0" />
          <Sel label="Type" options={INV_TYPES} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
          {ps.length > 1 && <Sel label="Personne" options={ps.map(p => ({ v: p.id, l: p.name }))} value={form.pid} onChange={e => setForm({ ...form, pid: e.target.value })} />}
          {!form.name.trim() && <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>Nom requis.</p>}
          <Btn full disabled={!form.name.trim()} onClick={doSave}>{show === "new" ? "Creer" : "Enregistrer"}</Btn>
          {show !== "new" && <Btn v="danger" full onClick={() => { setDelId(show); setShow(null); }}>Supprimer</Btn>}
        </div>
      </Modal>

      <Modal open={!!snapId} onClose={() => setSnapId(null)} title="Snapshot">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Valeur" suffix="EUR" type="number" inputMode="decimal" value={snapVal} onChange={e => setSnapVal(e.target.value)} />
          {!(parseFloat(snapVal) > 0) && <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>Valeur valide requise.</p>}
          <Btn full disabled={!(parseFloat(snapVal) > 0)} onClick={() => { const v = parseFloat(snapVal); if (!v) return; dispatch(addInvestmentSnapshot(snapId, { date: nowKey(), value: v })); toast("Enregistre"); setSnapId(null); setSnapVal(""); }}>Enregistrer</Btn>
        </div>
      </Modal>

      <ConfirmDialog open={!!arcId} onClose={() => setArcId(null)} onOk={() => { dispatch(archiveInvestmentAccount(arcId)); toast("Archive"); }} msg="Archiver ?" />
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onOk={() => { dispatch(deleteInvestmentAccount(delId)); toast("Supprime"); }} msg="Supprimer definitivement cet investissement ?" />
    </div>
  );
}
