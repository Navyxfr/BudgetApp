import React, { useState } from "react";
import { Home, Plus } from "lucide-react";

export default function EmptyHouseholdsFeature({ onCreate, CSS, Inp, Btn }) {
  const [name, setName] = useState("Mon foyer");
  const trimmedName = name.trim();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "grid", placeItems: "center", padding: 24, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text','Segoe UI',sans-serif" }}>
      <style>{CSS}</style>
      <div style={{ width: "100%", maxWidth: 380, background: "var(--card)", border: "1px solid var(--sep)", borderRadius: 28, padding: 24, boxShadow: "0 24px 50px rgba(16,22,35,.12)" }}>
        <div style={{ width: 58, height: 58, borderRadius: 18, background: "var(--accent2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <Home size={25} color="var(--accent)" />
        </div>
        <h1 style={{ fontSize: 24, color: "var(--text)", letterSpacing: -.6, margin: "0 0 8px" }}>Créer votre premier foyer</h1>
        <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.5, margin: "0 0 22px" }}>
          Aucun assistant de configuration : le foyer sera vide et vous pourrez ajouter ensuite les personnes, revenus, charges et budgets manuellement.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Inp label="Nom du foyer" value={name} onChange={event => setName(event.target.value)} placeholder="Mon foyer" />
          <Btn full disabled={!trimmedName} onClick={() => onCreate(trimmedName)}><Plus size={16} />Créer un foyer vide</Btn>
        </div>
      </div>
    </div>
  );
}
