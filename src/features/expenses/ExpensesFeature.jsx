import React, { useState } from "react";
import { CreditCard, Landmark, Plus, Receipt, Tag, Trash2 } from "lucide-react";
import {
  addExpense,
  addFixedCharge,
  deleteCategory,
  deleteExpense,
  deleteFixedCharge,
  updateExpense,
  updateFixedCharge,
  upsertCategory
} from "../../store/actions.js";

export default function ExpensesFeature({
  md,
  cats,
  cm,
  S,
  dispatch,
  toast,
  sumSpent,
  sumFC,
  eur,
  today,
  FREQ,
  COLORS,
  pressHandlers,
  SegTabs,
  KPI,
  SecTitle,
  EmptyState,
  Card,
  Row,
  Modal,
  Inp,
  Sel,
  Btn,
  Ico,
  Prog
}) {
  const [expTab, setExpTab] = useState("var");
  const [show, setShow] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ date: today(), cid: cats[0]?.id || "", amount: "", desc: "" });
  const [chgShow, setChgShow] = useState(false);
  const [chgEditId, setChgEditId] = useState(null);
  const [chgForm, setChgForm] = useState({ name: "", amount: "", freq: "monthly" });
  const [showCatEdit, setShowCatEdit] = useState(null);
  const [catEditForm, setCatEditForm] = useState({ name: "", icon: "ShoppingCart", color: COLORS[0] });
  const [deleteCatId, setDeleteCatId] = useState(null);

  const exps = [...(md.exp || [])].sort((a, b) => b.date.localeCompare(a.date));
  const manual = (md.charges || []).filter(c => !c.auto);
  const auto = (md.charges || []).filter(c => c.auto);

  const doSaveExp = () => {
    const a = parseFloat(String(form.amount).replace(",", "."));
    if (!a || !form.cid) return;
    if (editId) {
      dispatch(updateExpense(cm, editId, { ...form, amount: a }));
    } else {
      dispatch(addExpense(cm, { ...form, amount: a }));
    }
    toast(editId ? "Modifie" : "Ajoute");
    setShow(false);
    setEditId(null);
    setForm({ date: today(), cid: cats[0]?.id || "", amount: "", desc: "" });
  };

  const doSaveChg = () => {
    const a = parseFloat(String(chgForm.amount).replace(",", "."));
    if (!chgForm.name || !a) return;
    if (chgEditId) {
      dispatch(updateFixedCharge(cm, chgEditId, { name: chgForm.name, amount: a, freq: chgForm.freq }));
    } else {
      dispatch(addFixedCharge(cm, { name: chgForm.name, amount: a, freq: chgForm.freq, auto: false }));
    }
    toast(chgEditId ? "Modifie" : "Ajoute");
    setChgShow(false);
    setChgEditId(null);
    setChgForm({ name: "", amount: "", freq: "monthly" });
  };

  const saveCatEdit = () => {
    if (!catEditForm.name) return;
    if (showCatEdit === "new") {
      dispatch(upsertCategory({ name: catEditForm.name, icon: catEditForm.icon, color: catEditForm.color, o: S.cfg.categories.length }));
    } else {
      dispatch(upsertCategory({ id: showCatEdit, name: catEditForm.name, icon: catEditForm.icon, color: catEditForm.color }));
    }
    toast(showCatEdit === "new" ? "Creee" : "Modifiee");
    setShowCatEdit(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <SegTabs items={[{ v: "var", l: "Variables" }, { v: "fix", l: "Charges fixes" }, { v: "cat", l: "Categories" }]} active={expTab} onChange={setExpTab} />

      {expTab === "var" && (
        <>
          <Card>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>Synthese depenses</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <KPI label="Total depense" value={eur(sumSpent(md))} />
              <KPI label="Transactions" value={String(exps.length)} />
            </div>
          </Card>

          {cats.map(c => {
            const b = (md.cb || []).find(x => x.cid === c.id)?.budget || 0;
            const s = sumSpent(md, c.id);
            if (!b && !s) return null;
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 14, background: "var(--card)", border: "1px solid var(--sep)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: c.color + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ico name={c.icon} size={15} color={c.color} /></div>
                <div style={{ flex: 1 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}><span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{c.name}</span><span style={{ fontSize: 13, fontWeight: 600, color: b > 0 && s > b ? "var(--red)" : "var(--text3)" }}>{eur(s)} / {eur(b)}</span></div><Prog val={s} max={b} color={c.color} /></div>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid var(--sep)", paddingTop: 14 }}>
            <SecTitle title={"Transactions · " + exps.length} />
            {exps.length === 0 ? <EmptyState icon={Receipt} msg="Aucune depense" action="Ajouter" onAction={() => setShow(true)} /> :
              <Card p={0}><div style={{ padding: "4px 16px" }}>{exps.map(e => { const c = cats.find(x => x.id === e.cid); return (<Row key={e.id} onClick={() => { setForm({ date: e.date, cid: e.cid, amount: String(e.amount), desc: e.desc || "" }); setEditId(e.id); setShow(true); }} icon={<Ico name={c?.icon || "Receipt"} size={15} color={c?.color || "#999"} />} iconBg={(c?.color || "#999") + "12"} left={(c?.name || "?") + (e.desc ? " · " + e.desc : "")} sub={e.date} right={<span style={{ fontSize: 15, fontWeight: 700 }}>{eur(e.amount)}</span>} />); })}</div></Card>}
          </div>

          <div className="sa-fab" onClick={() => { setEditId(null); setForm({ date: today(), cid: cats[0]?.id || "", amount: "", desc: "" }); setShow(true); }} style={{ position: "fixed", right: 20, width: 58, height: 58, borderRadius: 19, background: "linear-gradient(135deg,var(--accent),#d7a171)", boxShadow: "0 10px 32px rgba(200,149,108,.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 30, border: "1px solid rgba(255,255,255,.22)" }} {...pressHandlers}><Plus size={24} color="#fff" /></div>
        </>
      )}

      {expTab === "fix" && (
        <>
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <KPI label="Total charges fixes" value={eur(sumFC(md))} />
              <KPI label="Charges manuelles" value={String(manual.length)} />
            </div>
          </Card>
          {auto.length > 0 && <><SecTitle title="Prets (auto)" /><Card p={0}><div style={{ padding: "4px 16px" }}>{auto.map(c => <Row key={c.id} icon={<Landmark size={15} color="var(--purple)" />} iconBg="var(--purple2)" left={c.name} sub="Mensualite pret" right={<span style={{ fontSize: 15, fontWeight: 700 }}>{eur(c.amount)}</span>} />)}</div></Card></>}
          <SecTitle title="Charges manuelles" right={<button onClick={() => { setChgEditId(null); setChgForm({ name: "", amount: "", freq: "monthly" }); setChgShow(true); }} style={{ width: 30, height: 30, borderRadius: 9, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={14} color="var(--text3)" /></button>} />
          {manual.length === 0 ? <EmptyState icon={CreditCard} msg="Aucune" action="Ajouter" onAction={() => setChgShow(true)} /> :
            <Card p={0}><div style={{ padding: "4px 16px" }}>{manual.map(c => <Row key={c.id} onClick={() => { setChgForm({ name: c.name, amount: String(c.amount), freq: c.freq }); setChgEditId(c.id); setChgShow(true); }} left={c.name} sub={FREQ.find(x => x.v === c.freq)?.l} right={<span style={{ fontSize: 15, fontWeight: 700 }}>{eur(c.amount)}</span>} />)}</div></Card>}
        </>
      )}

      {expTab === "cat" && (
        <>
          <SecTitle title="Categories de depenses" right={<button onClick={() => { setCatEditForm({ name: "", icon: "ShoppingCart", color: COLORS[cats.length % COLORS.length] }); setShowCatEdit("new"); }} style={{ width: 30, height: 30, borderRadius: 9, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={14} color="var(--text3)" /></button>} />
          {cats.length === 0 ? <EmptyState icon={Tag} msg="Aucune categorie" action="Creer" onAction={() => { setCatEditForm({ name: "", icon: "ShoppingCart", color: COLORS[0] }); setShowCatEdit("new"); }} /> :
            <Card p={0}><div style={{ padding: "4px 16px" }}>{[...cats].sort((a, b) => (a.o || 0) - (b.o || 0)).map(c => <Row key={c.id} onClick={() => { setCatEditForm({ name: c.name, icon: c.icon, color: c.color }); setShowCatEdit(c.id); }} icon={<Ico name={c.icon} size={15} color={c.color} />} iconBg={c.color + "12"} left={c.name} right={<button onClick={e => { e.stopPropagation(); setDeleteCatId(c.id); }} style={{ width: 24, height: 24, borderRadius: 6, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={11} color="var(--red)" /></button>} />)}</div></Card>}
        </>
      )}

      <Modal open={show} onClose={() => { setShow(false); setEditId(null); }} title={editId ? "Modifier" : "Nouvelle depense"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Sel label="Categorie" options={cats.map(c => ({ v: c.id, l: c.name }))} value={form.cid} onChange={e => setForm({ ...form, cid: e.target.value })} />
          <Inp label="Montant" suffix="€" type="number" inputMode="decimal" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
          <Inp label="Description" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Optionnel" />
          {!form.cid || !(parseFloat(String(form.amount).replace(",", ".")) > 0) ? <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>Categorie et montant valides requis.</p> : null}
          <Btn full disabled={!form.cid || !(parseFloat(String(form.amount).replace(",", ".")) > 0)} onClick={doSaveExp}>{editId ? "Modifier" : "Ajouter"}</Btn>
          {editId && <Btn v="danger" full onClick={() => { dispatch(deleteExpense(cm, editId)); toast("Supprime"); setShow(false); setEditId(null); }}>Supprimer</Btn>}
        </div>
      </Modal>

      <Modal open={chgShow} onClose={() => { setChgShow(false); setChgEditId(null); }} title={chgEditId ? "Modifier" : "Nouvelle charge"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom" value={chgForm.name} onChange={e => setChgForm({ ...chgForm, name: e.target.value })} placeholder="Ex: Assurance auto" />
          <Inp label="Montant" suffix="€" type="number" inputMode="decimal" value={chgForm.amount} onChange={e => setChgForm({ ...chgForm, amount: e.target.value })} />
          <Sel label="Frequence" options={FREQ} value={chgForm.freq} onChange={e => setChgForm({ ...chgForm, freq: e.target.value })} />
          {!(chgForm.name && parseFloat(String(chgForm.amount).replace(",", ".")) > 0) ? <p style={{ fontSize: 12, color: "var(--red)", margin: 0 }}>Nom et montant valides requis.</p> : null}
          <Btn full disabled={!(chgForm.name && parseFloat(String(chgForm.amount).replace(",", ".")) > 0)} onClick={doSaveChg}>{chgEditId ? "Modifier" : "Ajouter"}</Btn>
          {chgEditId && <Btn v="danger" full onClick={() => { dispatch(deleteFixedCharge(cm, chgEditId)); toast("Supprime"); setChgShow(false); setChgEditId(null); }}>Supprimer</Btn>}
        </div>
      </Modal>

      <Modal open={!!showCatEdit} onClose={() => setShowCatEdit(null)} title={showCatEdit === "new" ? "Nouvelle categorie" : "Modifier categorie"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom" value={catEditForm.name} onChange={e => setCatEditForm({ ...catEditForm, name: e.target.value })} placeholder="Ex: Restaurants" />
          <div><p style={{ fontSize: 12, fontWeight: 600, color: "var(--text3)", margin: "0 0 8px" }}>Couleur</p><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{COLORS.map(co => <div key={co} onClick={() => setCatEditForm({ ...catEditForm, color: co })} style={{ width: 32, height: 32, borderRadius: 9, background: co, cursor: "pointer", border: catEditForm.color === co ? "3px solid var(--text)" : "3px solid transparent" }} />)}</div></div>
          <Btn full onClick={saveCatEdit}>{showCatEdit === "new" ? "Creer" : "Modifier"}</Btn>
        </div>
      </Modal>
      <Modal open={!!deleteCatId} onClose={() => setDeleteCatId(null)} title="Confirmer">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text2)" }}>Supprimer cette categorie ?</p>
          <Btn v="danger" full onClick={() => { dispatch(deleteCategory(deleteCatId)); toast("Categorie supprimee"); setDeleteCatId(null); }}>Supprimer</Btn>
        </div>
      </Modal>
    </div>
  );
}
