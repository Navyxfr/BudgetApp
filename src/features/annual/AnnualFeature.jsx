import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnnualFeature({
  S,
  cm,
  MONTHS,
  parseMonthKey,
  getMonth,
  monthAggDeps,
  sumRev,
  sumFC,
  sumSpent,
  savBalance,
  eur,
  KPI,
  Card
}) {
  const yr = parseMonthKey(cm).getFullYear();
  const data = Array.from({ length: 12 }, (_, i) => {
    const k = yr + "-" + String(i + 1).padStart(2, "0");
    const m = getMonth(S, k, monthAggDeps);
    return { name: MONTHS[i].slice(0, 3), Rev: sumRev(m), Dep: sumFC(m) + sumSpent(m) };
  });
  const tR = data.reduce((s, d) => s + d.Rev, 0);
  const tD = data.reduce((s, d) => s + d.Dep, 0);
  const tSav = S.savings.filter(a => !a.ar).reduce((s, a) => s + savBalance(a), 0);
  const tInv = S.investments.filter(a => !a.ar).reduce((s, a) => s + ((a.snapshots || []).slice(-1)[0]?.value || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 6px" }}>Vue annuelle</p>
        <p style={{ fontSize: 30, fontWeight: 750, color: "var(--text)", margin: 0, letterSpacing: -1 }}>{yr}</p>
        <p style={{ fontSize: 12, color: "var(--text3)", margin: "4px 0 0" }}>Performance globale et patrimoine</p>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <KPI label="Revenus" value={eur(tR)} />
        <KPI label="Depenses" value={eur(tD)} />
        <KPI label="Net" value={eur(tR - tD)} color={tR - tD >= 0 ? "var(--green)" : "var(--red)"} />
        <KPI label="Patrimoine" value={eur(tSav + tInv)} color="var(--blue)" />
      </div>
      <Card p={18}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 16px" }}>Tendances</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text3)" }} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text3)" }} tickFormatter={v => Math.round(v / 1000) + "k"} />
            <Tooltip formatter={v => eur(v)} contentStyle={{ borderRadius: 14, fontSize: 12, border: "none", background: "var(--card)" }} />
            <Line type="monotone" dataKey="Rev" name="Revenus" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="Dep" name="Depenses" stroke="var(--red)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
