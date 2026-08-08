import React from "react";
import { Copy } from "lucide-react";
import { monthLabel } from "../../core/date.js";

export default function MonthPreparationModal({ pendingMonth, onChoose, onClose, Modal, Btn }) {
  return (
    <Modal
      open={!!pendingMonth}
      onClose={onClose}
      title={pendingMonth ? `Préparer ${monthLabel(pendingMonth.targetMonth)}` : "Préparer le mois"}
    >
      {pendingMonth && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 16, borderRadius: 16, background: "var(--accent2)" }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" }}>
              Souhaitez-vous reprendre votre organisation de {monthLabel(pendingMonth.sourceMonth)} ?
            </p>
            <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, margin: 0 }}>
              Revenus, charges manuelles et budgets seront copiés avec de nouveaux identifiants. Vos transactions ne le seront jamais.
            </p>
          </div>
          <Btn full onClick={() => onChoose("copy")}>
            <Copy size={16} /> Reprendre {monthLabel(pendingMonth.sourceMonth)}
          </Btn>
          <Btn full v="secondary" onClick={() => onChoose("empty")}>Commencer à zéro</Btn>
          <Btn full v="ghost" onClick={onClose}>Annuler</Btn>
        </div>
      )}
    </Modal>
  );
}
