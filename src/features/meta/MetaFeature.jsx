import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MetaFeature({
  mode,
  activePage,
  activeHouseholdName,
  monthLabelText,
  monthStatus,
  onPrevMonth,
  onNextMonth,
  canGoNextMonth
}) {
  if (mode === "household") {
    if (!activeHouseholdName) return null;
    return (
      <p style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", margin: 0 }}>
        {activeHouseholdName}
      </p>
    );
  }

  if (mode === "monthNav") {
    if (activePage === "cfg") return null;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, paddingBottom: 12 }}>
        <button aria-label="Mois précédent" onClick={onPrevMonth} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--sep)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={22} color="var(--text3)" />
        </button>
        <div style={{ minWidth: 170, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text2)", margin: 0 }}>{monthLabelText}</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: monthStatus === "completed" ? "var(--green)" : "var(--text3)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: .5 }}>
            {{ prepared: "Préparé", empty: "Vierge", completed: "Terminé", missing: "Non créé" }[monthStatus] || ""}
          </p>
        </div>
        <button aria-label="Mois suivant" onClick={onNextMonth} disabled={!canGoNextMonth} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--sep)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: canGoNextMonth ? 1 : 0.3 }}>
          <ChevronRight size={22} color="var(--text3)" />
        </button>
      </div>
    );
  }

  return (
    null
  );
}
