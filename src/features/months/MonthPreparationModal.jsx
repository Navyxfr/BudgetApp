import React, { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { monthLabel } from "../../core/date.js";

export default function MonthPreparationModal({ pendingMonth, importableMonths, onChoose, onClose, Modal, Btn }) {
  const [showMonths, setShowMonths] = useState(false);

  useEffect(() => setShowMonths(false), [pendingMonth?.targetMonth]);

  return (
    <Modal
      open={!!pendingMonth}
      onClose={onClose}
      title={pendingMonth ? `Préparer ${monthLabel(pendingMonth.targetMonth)}` : "Préparer le mois"}
    >
      {pendingMonth && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 16, borderRadius: 16, background: "var(--accent2)" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>Comment souhaitez-vous préparer ce mois ?</p>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>
              Vous pouvez importer l’organisation d’un mois déjà rempli ou commencer avec des montants à zéro.
            </p>
          </div>
          <Btn full onClick={() => setShowMonths(value => !value)} disabled={importableMonths.length === 0}>
            <Copy size={16} /> Importer les données d’un mois
          </Btn>
          {showMonths && (
            <div role="list" aria-label="Mois disponibles" style={{ border: "1px solid var(--sep)", borderRadius: 16, overflow: "hidden" }}>
              {importableMonths.map(({ monthKey, status }) => (
                <button
                  type="button"
                  role="listitem"
                  key={monthKey}
                  onClick={() => onChoose("copy", monthKey)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "none", borderBottom: "1px solid var(--sep2)", background: "var(--card)", color: "var(--text)", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 650 }}>{monthLabel(monthKey)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: status === "completed" ? "var(--green)" : "var(--accent)" }}>{status === "completed" ? "Terminé" : "Préparé"}</span>
                  <Check size={15} color="var(--text3)" />
                </button>
              ))}
            </div>
          )}
          {importableMonths.length === 0 && <p style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", margin: -4 }}>Aucun autre mois rempli n’est disponible.</p>}
          {showMonths && <p style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.45, margin: 0 }}>Les revenus, charges manuelles et budgets seront copiés. Les transactions resteront dans leur mois d’origine.</p>}
          <Btn full v="secondary" onClick={() => onChoose("empty")}>Commencer à zéro</Btn>
          <Btn full v="ghost" onClick={onClose}>Annuler</Btn>
        </div>
      )}
    </Modal>
  );
}
