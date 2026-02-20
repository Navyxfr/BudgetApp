import React, { useState } from "react";
import { Plus, Target, Edit3, Archive, Trash2 } from "lucide-react";
import {
  addSavingsAccount,
  updateSavingsAccountMetadata,
  deleteSavingsAccount,
  addSavingsMovement,
  addSavingsObjective
} from "../../store/actions.js";

export default function SavingsFeature({
  ps,
  S,
  dispatch,
  toast,
  savBalance,
  eur,
  today,
  SAV_TYPES,
  pct,
  KPI,
  Card,
  Prog,
  Btn,
  Modal,
  Inp,
  Sel,
  SegTabs,
  ConfirmDialog
}) {
  const [show, setShow] = useState(null);
  const [movId, setMovId] = useState(null);
  const [objId, setObjId] = useState(null);
  const [arcId, setArcId] = useState(null);
  const [delId, setDelId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "livret", pid: ps[0]?.id || "A", bal: "" });
  const [movForm, setMovForm] = useState({ amount: "", type: "deposit", date: today() });
  const [objForm, setObjForm] = useState({ name: "", target: "", dl: "" });

  const accs = S.savings.filter(a => !a.ar);
  const total = accs.reduce((s, a) => s + savBalance(a), 0);
  const personById = Object.fromEntries((ps || []).map(p => [p.id, p]));

  const movementSignedAmount = movement => {
    const amount = Number(movement?.amount || 0);
    const type = String(movement?.type || "").toLowerCase();
    if (type === "debit" || type === "withdrawal") return -Math.abs(amount);
    if (type === "credit" || type === "deposit") return Math.abs(amount);
    return amount;
  };

  const movementLabel = movement => {
    if (movement?.source === "simulation") {
      const contributorName = personById[movement?.contributorId]?.name;
      return contributorName ? `Simulation · ${contributorName}` : "Simulation";
    }
    const type = String(movement?.type || "").toLowerCase();
    if (type === "debit" || type === "withdrawal") return "Retrait manuel";
    if (type === "credit" || type === "deposit") return "Versement manuel";
    return "Mouvement";
  };

  const movementDate = movement => {
    const raw = movement?.date;
    if (!raw) return "";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return String(raw);
    return dt.toLocaleDateString("fr-FR");
  };

  const doSave = () => {
    if (!form.name) return;
    if (show === "new") {
      dispatch(addSavingsAccount({ name: form.name, type: form.type, pid: form.pid, openingBalance: parseFloat(form.bal) || 0, movements: [], ar: false, objectives: [] }));
    } else {
      dispatch(updateSavingsAccountMetadata(show, { name: form.name, type: form.type, pid: form.pid, openingBalance: parseFloat(form.bal) || 0 }));
    }
    toast(show === "new" ? "Cree" : "Modifie");
    setShow(null);
  };

  const doMov = () => {
    const a = parseFloat(String(movForm.amount).replace(",", "."));
    if (!a) return;
    dispatch(addSavingsMovement(movId, { amount: a, type: movForm.type === "withdrawal" ? "debit" : "credit", date: movForm.date }));
    toast(movForm.type === "deposit" ? "Verse" : "Retire");
    setMovId(null);
    setMovForm({ amount: "", type: "deposit", date: today() });
  };

  const doObj = () => {
    if (!objForm.name) return;
    dispatch(addSavingsObjective(objId, { name: objForm.name, target: parseFloat(objForm.target) || 0, dl: objForm.dl }));
    toast("Objectif ajoute");
    setObjId(null);
    setObjForm({ name: "", target: "", dl: "" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>Synthese epargne</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <KPI label="Epargne totale" value={eur(total)} color="var(--green)" />
          <KPI label="Comptes actifs" value={String(accs.length)} />
        </div>
      </Card>

      {accs.map(a => {
        const b = savBalance(a);
        const pn = ps.find(p => p.id === a.pid);
        return (
          <Card key={a.id} p={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div><p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>{a.name}</p><div style={{ display: "flex", gap: 6, marginTop: 4 }}><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--bg2)", color: "var(--text2)" }}>{SAV_TYPES.find(t => t.v === a.type)?.l}</span>{pn && <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 100, background: "var(--accent2)", color: "var(--accent)" }}>{pn.name}</span>}</div></div>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", letterSpacing: -0.5, margin: 0 }}>{eur(b)}</p>
            </div>
            {(a.objectives || []).map(o => {
              const pv = o.target > 0 ? b / o.target * 100 : 0;
              return (
                <div key={o.id} style={{ padding: 12, background: "var(--bg2)", borderRadius: "var(--r3)", marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "flex", alignItems: "center", gap: 4 }}><Target size={12} />{o.name}</span><span style={{ fontSize: 12, fontWeight: 700, color: "var(--green)" }}>{pct(pv)}</span></div>
                  <Prog val={b} max={o.target} color="var(--green)" />
                  <p style={{ fontSize: 11, color: "var(--text3)", margin: "4px 0 0" }}>Objectif : {eur(o.target)}{o.dl ? " · " + o.dl : ""}</p>
                </div>
              );
            })}
            {(a.movements || []).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 8px" }}>Mouvements</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...(a.movements || [])]
                    .sort((m1, m2) => String(m2.date || "").localeCompare(String(m1.date || "")))
                    .slice(0, 6)
                    .map(m => {
                      const signed = movementSignedAmount(m);
                      return (
                        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 10, background: "var(--bg2)" }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12, color: "var(--text2)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{movementLabel(m)}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "var(--text3)" }}>{movementDate(m)}</p>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: signed >= 0 ? "var(--green)" : "var(--red)" }}>{eur(signed)}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <Btn sm v="secondary" onClick={() => setMovId(a.id)}><Plus size={13} />Mouvement</Btn>
              <Btn sm v="secondary" onClick={() => setObjId(a.id)}><Target size={13} />Objectif</Btn>
              <Btn sm v="ghost" onClick={() => { setForm({ name: a.name, type: a.type, pid: a.pid, bal: String(a.openingBalance ?? a.balance ?? 0) }); setShow(a.id); }}><Edit3 size={13} /></Btn>
              <Btn sm v="ghost" onClick={() => setArcId(a.id)}><Archive size={13} /></Btn>
              <Btn sm v="danger" onClick={() => setDelId(a.id)}><Trash2 size={13} /></Btn>
            </div>
          </Card>
        );
      })}

      <Btn v="secondary" full onClick={() => { setForm({ name: "", type: "livret", pid: ps[0]?.id || "A", bal: "" }); setShow("new"); }}><Plus size={16} />Nouveau compte</Btn>
      <Modal open={!!show} onClose={() => setShow(null)} title={show === "new" ? "Nouveau" : "Modifier"}><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><Inp label="Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><Inp label="Solde" suffix="€" type="number" inputMode="decimal" value={form.bal} onChange={e => setForm({ ...form, bal: e.target.value })} /><Sel label="Type" options={SAV_TYPES} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />{ps.length > 1 && <Sel label="Personne" options={ps.map(p => ({ v: p.id, l: p.name }))} value={form.pid} onChange={e => setForm({ ...form, pid: e.target.value })} />}{!form.name.trim()&&<p style={{fontSize:12,color:"var(--red)",margin:0}}>Nom requis.</p>}<Btn full disabled={!form.name.trim()} onClick={doSave}>{show === "new" ? "Creer" : "Enregistrer"}</Btn>{show !== "new" && <Btn v="danger" full onClick={() => { setDelId(show); setShow(null); }}>Supprimer</Btn>}</div></Modal>
      <Modal open={!!movId} onClose={() => setMovId(null)} title="Mouvement"><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><SegTabs items={[{ v: "deposit", l: "Versement" }, { v: "withdrawal", l: "Retrait" }]} active={movForm.type} onChange={v => setMovForm({ ...movForm, type: v })} /><Inp label="Montant" suffix="€" type="number" inputMode="decimal" value={movForm.amount} onChange={e => setMovForm({ ...movForm, amount: e.target.value })} /><Inp label="Date" type="date" value={movForm.date} onChange={e => setMovForm({ ...movForm, date: e.target.value })} />{!(parseFloat(String(movForm.amount).replace(",", "."))>0)&&<p style={{fontSize:12,color:"var(--red)",margin:0}}>Montant valide requis.</p>}<Btn full disabled={!(parseFloat(String(movForm.amount).replace(",", "."))>0)} onClick={doMov}>{movForm.type === "deposit" ? "Verser" : "Retirer"}</Btn></div></Modal>
      <Modal open={!!objId} onClose={() => setObjId(null)} title="Objectif"><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><Inp label="Nom" value={objForm.name} onChange={e => setObjForm({ ...objForm, name: e.target.value })} placeholder="Ex: Vacances" /><Inp label="Cible" suffix="€" type="number" inputMode="decimal" value={objForm.target} onChange={e => setObjForm({ ...objForm, target: e.target.value })} /><Inp label="Echeance" type="month" value={objForm.dl} onChange={e => setObjForm({ ...objForm, dl: e.target.value })} />{!objForm.name.trim()&&<p style={{fontSize:12,color:"var(--red)",margin:0}}>Nom requis.</p>}<Btn full disabled={!objForm.name.trim()} onClick={doObj}>Ajouter</Btn></div></Modal>
      <ConfirmDialog open={!!arcId} onClose={() => setArcId(null)} onOk={() => { dispatch(updateSavingsAccountMetadata(arcId, { ar: true })); toast("Archive"); }} msg="Archiver ce compte ?" />
      <ConfirmDialog open={!!delId} onClose={() => setDelId(null)} onOk={() => { dispatch(deleteSavingsAccount(delId)); toast("Supprime"); }} msg="Supprimer definitivement ce compte d'epargne ?" />
    </div>
  );
}
