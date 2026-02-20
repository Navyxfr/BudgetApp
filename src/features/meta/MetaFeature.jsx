import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MetaFeature({
  mode,
  activePage,
  activeHouseholdName,
  monthLabelText,
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
        <button onClick={onPrevMonth} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--sep)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={22} color="var(--text3)" />
        </button>
        <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text2)", minWidth: 170, textAlign: "center", margin: 0 }}>{monthLabelText}</p>
        <button onClick={onNextMonth} disabled={!canGoNextMonth} style={{ width: 34, height: 34, borderRadius: 10, background: "var(--bg2)", border: "1px solid var(--sep)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: canGoNextMonth ? 1 : 0.3 }}>
          <ChevronRight size={22} color="var(--text3)" />
        </button>
      </div>
    );
  }

  return (
    null
  );
}
