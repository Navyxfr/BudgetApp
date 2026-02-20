import React, { useRef, useState } from "react";
import {
  Baby,
  Check,
  Cloud,
  CloudOff,
  Copy,
  Download,
  Edit3,
  Home,
  LogIn,
  Monitor,
  Moon,
  Plus,
  Sun,
  Trash2,
  Upload,
  Users
} from "lucide-react";
import {
  hydrateFromStorage,
  setThemeMode,
  addPerson,
  updatePersonName,
  setPersonType,
  removePerson,
  resetFoyer
} from "../../store/actions.js";

export default function SettingsFeature({
  dispatch,
  uid,
  toast,
  meta,
  setMeta,
  save,
  load,
  switchHH,
  createHH,
  deleteHH,
  renameHH,
  S,
  ps,
  cm,
  COLORS,
  Btn,
  Card,
  EditableName,
  SegTabs,
  exportCSV,
  exportJSON,
  exportBackup,
  defaultState,
  defaultMonth,
  monthAggDeps,
  Inp,
  Modal,
  ConfirmDialog,
  authUser,
  setAuthUser
}) {
  const importInputRef = useRef(null);
  const [newHHName, setNewHHName] = useState("");
  const [showNewHH, setShowNewHH] = useState(false);
  const [copyCharges, setCopyCharges] = useState(true);
  const [editHH, setEditHH] = useState(null);
  const [editHHName, setEditHHName] = useState("");
  const [delHHId, setDelHHId] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [removePersonId, setRemovePersonId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const households = meta?.households || [];
  const activeHH = households.find(h => h.id === meta?.active);
  const sectionLabelStyle = { fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "4px 2px -8px" };

  const handleImport = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const data = JSON.parse(txt);
      if (data.meta && data.households) {
        for (const h of data.meta.households) {
          await save(h.id, data.households[h.id]);
        }
        const merged = [...households.filter(h => !data.meta.households.find(x => x.id === h.id)), ...data.meta.households];
        setMeta({ households: merged, active: data.meta.active || merged[0]?.id });
        const d = await load(data.meta.active || merged[0]?.id);
        dispatch(hydrateFromStorage(d));
        toast("Backup restaure !");
      } else if (data.cfg) {
        const id = uid();
        const hh = [...households, { id, name: "Import " + new Date().toLocaleDateString("fr-FR"), created: new Date().toISOString() }];
        await save(id, data);
        setMeta({ households: hh, active: id });
        dispatch(hydrateFromStorage(data));
        toast("Donnees importees !");
      } else {
        toast("Format invalide", "err");
      }
    } catch (err) {
      toast("Erreur import", "err");
    }
    setShowImport(false);
  };

  const duplicateHousehold = async sourceHousehold => {
    if (!sourceHousehold?.id) return;
    try {
      const sourceState = await load(sourceHousehold.id);
      if (!sourceState) {
        toast("Foyer source introuvable", "err");
        return;
      }
      const id = uid();
      const baseName = (sourceHousehold.name || "Foyer").trim();
      const existingNames = new Set((households || []).map(h => (h.name || "").trim().toLowerCase()));
      let name = `${baseName} (copie)`;
      let suffix = 2;
      while (existingNames.has(name.toLowerCase())) {
        name = `${baseName} (copie ${suffix})`;
        suffix += 1;
      }
      await save(id, JSON.parse(JSON.stringify(sourceState)));
      setMeta(p => ({
        ...p,
        households: [...(p?.households || []), { id, name, created: new Date().toISOString() }]
      }));
      toast("Foyer duplique");
    } catch (e) {
      toast("Erreur duplication", "err");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Card p={18}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.6, margin: "0 0 8px" }}>Centre de controle</p>
        <p style={{ fontSize: 14, color: "var(--text2)", margin: 0, lineHeight: 1.5 }}>
          Gere la synchronisation cloud, l'organisation du foyer et les options de sauvegarde depuis un seul ecran.
        </p>
      </Card>
      <p style={sectionLabelStyle}>Compte et sync</p>
      <Card p={18}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Synchronisation cloud</p>
        {authUser ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--green2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Cloud size={20} color="var(--green)" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{authUser.displayName || authUser.email}</p>
                <p style={{ fontSize: 11, color: "var(--green)", margin: 0, fontWeight: 700 }}>Synchronise</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn sm v="secondary" onClick={async () => { try { await window.firebaseAuth.forceSync(); toast("Synchronise !"); } catch (e) { toast("Erreur sync"); } }}><Cloud size={14} />Synchroniser maintenant</Btn>
              <Btn sm v="muted" onClick={async () => { await window.firebaseAuth.signOut(); setAuthUser(null); toast("Deconnecte"); }}>Deconnexion</Btn>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CloudOff size={20} color="var(--text3)" /></div>
              <div><p style={{ fontSize: 14, fontWeight: 500, color: "var(--text2)", margin: 0 }}>Compte requis</p><p style={{ fontSize: 11, color: "var(--text3)", margin: "2px 0 0" }}>Connectez-vous pour acceder a vos foyers</p></div>
            </div>
            <Btn full onClick={async () => { try { const u = await window.firebaseAuth.signIn(); if (u) { setAuthUser(u); toast("Connecte !"); } } catch (e) { if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/redirect-cancelled-by-user") toast(e.code || e.message); } }}><LogIn size={16} />Se connecter avec Google</Btn>
          </div>
        )}
      </Card>

      <p style={sectionLabelStyle}>Apparence</p>
      <Card>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ v: "auto", i: Monitor, l: "Auto" }, { v: "light", i: Sun, l: "Clair" }, { v: "dark", i: Moon, l: "Sombre" }].map(({ v, i: I2, l }) => (
            <button key={v} onClick={() => dispatch(setThemeMode(v))} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 12, borderRadius: 14, border: "2px solid " + (S.cfg.dark === v ? "var(--accent)" : "var(--sep)"), background: S.cfg.dark === v ? "var(--accent2)" : "transparent", cursor: "pointer" }}>
              <I2 size={18} color={S.cfg.dark === v ? "var(--accent)" : "var(--text3)"} strokeWidth={1.8} /><span style={{ fontSize: 12, fontWeight: 700, color: S.cfg.dark === v ? "var(--accent)" : "var(--text3)" }}>{l}</span>
            </button>
          ))}
        </div>
      </Card>

      <p style={sectionLabelStyle}>Organisation du foyer</p>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Foyers</p>
          <button onClick={() => { setNewHHName(""); setShowNewHH(true); }} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={16} color="var(--text3)" /></button>
        </div>
        {households.map(h => (
          <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--sep2)" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: h.id === meta?.active ? "var(--accent2)" : "var(--bg2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Home size={16} color={h.id === meta?.active ? "var(--accent)" : "var(--text3)"} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 14, fontWeight: h.id === meta?.active ? 700 : 500, color: "var(--text)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</p>{h.id === meta?.active && <p style={{ fontSize: 11, color: "var(--accent)", margin: 0, fontWeight: 700 }}>Actif</p>}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {h.id !== meta?.active && <Btn sm v="secondary" onClick={() => switchHH(h.id)}>Ouvrir</Btn>}
              <button onClick={() => duplicateHousehold(h)} style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} title="Dupliquer"><Copy size={13} color="var(--text3)" /></button>
              <button onClick={() => { setEditHH(h.id); setEditHHName(h.name); }} style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Edit3 size={13} color="var(--text3)" /></button>
              {households.length > 1 && <button onClick={() => setDelHHId(h.id)} style={{ width: 32, height: 32, borderRadius: 9, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={13} color="var(--red)" /></button>}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}><p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Personnes du foyer</p><button onClick={() => dispatch(addPerson({ name: "Personne " + (ps.length + 1), type: "adult" }))} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus size={16} color="var(--text3)" /></button></div>
        {ps.map(p => (
          <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--sep2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: (p.type || "adult") === "child" ? "var(--orange2)" : "var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{(p.type || "adult") === "child" ? <Baby size={16} color="var(--orange)" /> : <Users size={16} color="var(--accent)" />}</div>
              <div style={{ flex: 1 }}><EditableName value={p.name} onCommit={v => dispatch(updatePersonName(p.id, v))} style={{ width: "100%", background: "transparent", border: "none", fontSize: 15, fontWeight: 600, color: "var(--text)", outline: "none", padding: 0 }} /></div>
              {ps.length > 1 && <button onClick={() => setRemovePersonId(p.id)} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--red2)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={12} color="var(--red)" /></button>}
            </div>
            <SegTabs items={[{ v: "adult", l: "Adulte" }, { v: "child", l: "Enfant" }]} active={p.type || "adult"} onChange={v => dispatch(setPersonType(p.id, v))} />
          </div>
        ))}
        <p style={{ fontSize: 11, color: "var(--text3)", margin: "10px 0 0", lineHeight: 1.4 }}>Les adultes ont des revenus et participent au prorata. Les enfants peuvent avoir des comptes d'epargne/investissement sans revenu.</p>
      </Card>

      <p style={sectionLabelStyle}>Sauvegarde et transfert</p>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Export</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn sm v="secondary" onClick={() => { exportCSV(S, activeHH?.name || "budget"); toast("CSV exporte"); }}><Download size={13} />CSV depenses</Btn><Btn sm v="secondary" onClick={() => { exportJSON(S, activeHH?.name || "budget"); toast("JSON exporte"); }}><Download size={13} />JSON foyer</Btn></div>
        <div style={{ height: 1, background: "var(--sep2)", margin: "14px 0" }} />
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Backup</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><Btn sm v="secondary" onClick={() => { if (meta) exportBackup(meta); toast("Backup telecharge"); }}><Download size={13} />Backup complet (.bpbackup)</Btn><Btn sm v="secondary" onClick={() => setShowImport(true)}><Upload size={13} />Restaurer</Btn></div>
        <p style={{ fontSize: 11, color: "var(--text3)", margin: "8px 0 0", lineHeight: 1.4 }}>JSON foyer = foyer actif uniquement. Backup (.bpbackup) = tous les foyers + meta.</p>
      </Card>

      <p style={sectionLabelStyle}>Zone sensible</p>
      <Card p={18}>
        <div style={{ border: "1px solid var(--red2)", background: "color-mix(in srgb, var(--red2) 35%, transparent)", borderRadius: 14, padding: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>Danger</p>
          <p style={{ fontSize: 12, color: "var(--text2)", margin: "0 0 12px" }}>Cette action supprime toutes les donnees du foyer actif.</p>
          <Btn v="danger" sm onClick={() => setConfirmReset(true)}>Reinitialiser ce foyer</Btn>
        </div>
        <p style={{ fontSize: 11, color: "var(--text4)", margin: "10px 0 0" }}>V4.1 · Multi-foyers · Stockage local</p>
      </Card>

      <Modal open={showNewHH} onClose={() => setShowNewHH(false)} title="Nouveau foyer">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom du foyer" value={newHHName} onChange={e => setNewHHName(e.target.value)} placeholder="Ex: Maison secondaire" />
          <div onClick={() => setCopyCharges(!copyCharges)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: copyCharges ? "var(--accent2)" : "var(--bg2)", cursor: "pointer", border: copyCharges ? "1.5px solid var(--accent)" : "1.5px solid transparent" }}><div style={{ width: 22, height: 22, borderRadius: 6, background: copyCharges ? "var(--accent)" : "var(--bg)", border: copyCharges ? "none" : "2px solid var(--text4)", display: "flex", alignItems: "center", justifyContent: "center" }}>{copyCharges && <Check size={14} color="#fff" />}</div><div><p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: 0 }}>Copier les charges du foyer actif</p><p style={{ fontSize: 12, color: "var(--text3)", margin: "2px 0 0" }}>Charges fixes, categories et budgets variables</p></div></div>
          <Btn full onClick={() => { if (!newHHName.trim()) return; const ps2 = [{ id: "A", name: "Personne A", type: "adult" }]; const ns = defaultState(ps2, undefined, { uidFn: uid, colors: COLORS }); if (copyCharges && S) { ns.cfg.categories = [...S.cfg.categories.map(c => ({ ...c }))]; const curMonth = Object.values(S.months).find(m => m.ok); if (curMonth) { const firstKey = Object.keys(ns.months)[0] || cm; ns.months[firstKey] = { ...defaultMonth(firstKey, ns, monthAggDeps), charges: [...(curMonth.charges || []).filter(c => !c.auto).map(c => ({ ...c, id: uid() }))], cb: [...(curMonth.cb || []).map(b => ({ ...b }))] }; } } createHH(newHHName.trim(), ns); setShowNewHH(false); setCopyCharges(true); }}>Creer</Btn>
        </div>
      </Modal>

      <Modal open={!!editHH} onClose={() => setEditHH(null)} title="Renommer le foyer"><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><Inp label="Nom" value={editHHName} onChange={e => setEditHHName(e.target.value)} /><Btn full onClick={() => { if (!editHHName.trim()) return; renameHH(editHH, editHHName.trim()); toast("Renomme"); setEditHH(null); }}>Enregistrer</Btn></div></Modal>
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Restaurer un backup">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>Selectionnez un export foyer (.json) ou un backup complet (.bpbackup).</p>
          <input ref={importInputRef} type="file" accept=".json,.bpbackup,application/json,application/x-budget-backup+json" onChange={handleImport} style={{ display: "none" }} />
          <Btn full onClick={() => importInputRef.current?.click()}><Upload size={14} />Choisir un fichier</Btn>
        </div>
      </Modal>
      <ConfirmDialog open={!!delHHId} onClose={() => setDelHHId(null)} onOk={() => { deleteHH(delHHId); toast("Foyer supprime"); }} msg="Supprimer definitivement ce foyer et toutes ses donnees ?" />
      <ConfirmDialog open={!!removePersonId} onClose={() => setRemovePersonId(null)} onOk={() => { dispatch(removePerson(removePersonId)); toast("Personne retiree"); }} msg="Retirer cette personne du foyer ?" />
      <ConfirmDialog open={confirmReset} onClose={() => setConfirmReset(false)} onOk={() => { dispatch(resetFoyer()); toast("Reinitialise"); }} msg="Supprimer toutes les donnees du foyer actif ?" />
    </div>
  );
}







