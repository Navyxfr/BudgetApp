import React, { useMemo, useState } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

export default function DashFeature({
  md,
  cats,
  ps,
  S,
  setWiz,
  setPage,
  setSub,
  eur,
  pct,
  sumRev,
  sumFC,
  sumVarBudget,
  sumSpent,
  savBalance,
  personBalance,
  revPerson,
  AlertBanner,
  SegTabs,
  KPI,
  Card,
  Prog,
  pressHandlers
}) {
  const [v, sV] = useState("all");
  const { tr, tf, tvb, tvs, tSav, tInv } = useMemo(() => ({
    tr: sumRev(md),
    tf: sumFC(md),
    tvb: sumVarBudget(md),
    tvs: sumSpent(md),
    tSav: S.savings.filter(a => !a.ar).reduce((s, a) => s + savBalance(a), 0),
    tInv: S.investments.filter(a => !a.ar).reduce((s, a) => s + ((a.snapshots || []).slice(-1)[0]?.value || 0), 0)
  }), [S.investments, S.savings, md, savBalance, sumFC, sumRev, sumSpent, sumVarBudget]);

  const spentByCategory = useMemo(
    () =>
      Object.fromEntries(
        cats.map(c => [c.id, sumSpent(md, c.id)])
      ),
    [cats, md, sumSpent]
  );

  const over = useMemo(
    () =>
      cats.filter(c => {
        const b = (md.cb || []).find(x => x.cid === c.id)?.budget || 0;
        return b > 0 && (spentByCategory[c.id] || 0) > b;
      }),
    [cats, md.cb, spentByCategory]
  );

  const chartData = useMemo(
    () =>
      cats
        .map(c => ({ name: c.name, Budget: (md.cb || []).find(x => x.cid === c.id)?.budget || 0, Reel: spentByCategory[c.id] || 0 }))
        .filter(d => d.Budget > 0 || d.Reel > 0),
    [cats, md.cb, spentByCategory]
  );

  const pieData = useMemo(
    () => cats.map(c => ({ name: c.name, value: spentByCategory[c.id] || 0, color: c.color })).filter(d => d.value > 0),
    [cats, spentByCategory]
  );

  const adultBalances = useMemo(
    () =>
      Object.fromEntries(
        ps
          .filter(p => (p.type || "adult") === "adult")
          .map(p => [p.id, personBalance(md, p.id)])
      ),
    [md, personBalance, ps]
  );

  const PersonView = ({ pid }) => {
    const p = ps.find(x => x.id === pid);
    const isA = (p?.type || "adult") === "adult";
    const a = md.alloc?.[pid] || {};
    const savTotal = (a.sav || []).reduce((s, x) => s + (x.amount || 0), 0);
    const invTotal = (a.inv || []).reduce((s, x) => s + (x.amount || 0), 0);
    if (!isA) {
      const childSav = S.savings.filter(x => !x.ar && x.pid === pid);
      const childInv = S.investments.filter(x => !x.ar && x.pid === pid);
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>
              Epargne - {p?.name}
            </p>
            {childSav.length === 0 && childInv.length === 0 && <p style={{ fontSize: 14, color: "var(--text3)", margin: "10px 0 0" }}>Aucun compte rattache</p>}
            {childSav.map(a2 => (
              <div key={a2.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                <span style={{ fontSize: 14, color: "var(--text2)" }}>{a2.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{eur(savBalance(a2))}</span>
              </div>
            ))}
            {childInv.map(a2 => {
              const val = (a2.snapshots || []).slice(-1)[0]?.value || 0;
              return (
                <div key={a2.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                  <span style={{ fontSize: 14, color: "var(--text2)" }}>{a2.name}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{eur(val)}</span>
                </div>
              );
            })}
          </Card>
          {md.ok && (savTotal > 0 || invTotal > 0) && (
            <Card>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
                Virements ce mois
              </p>
              {(a.sav || [])
                .filter(x => x.amount > 0)
                .map(x => {
                  const acc = S.savings.find(s2 => s2.id === x.accId);
                  return (
                    <div key={x.accId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                      <span style={{ color: "var(--text2)" }}>{"-> "}{acc?.name || "Epargne"}</span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>{eur(x.amount)}</span>
                    </div>
                  );
                })}
              {(a.inv || [])
                .filter(x => x.amount > 0)
                .map(x => {
                  const acc = S.investments.find(i2 => i2.id === x.accId);
                  return (
                    <div key={x.accId} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13 }}>
                      <span style={{ color: "var(--text2)" }}>{"-> "}{acc?.name || "Invest."}</span>
                      <span style={{ fontWeight: 700, color: "var(--blue)" }}>{eur(x.amount)}</span>
                    </div>
                  );
                })}
            </Card>
          )}
        </div>
      );
    }
    const bal = personBalance(md, pid);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Card>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Reste a vivre - {p?.name}</p>
          <p style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.2, color: bal >= 0 ? "var(--green)" : "var(--red)", margin: "6px 0 0" }}>{eur(bal)}</p>
        </Card>
        <Card>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>Repartition</p>
          {[["Revenus", eur(revPerson(md, pid)), false], ["-> Charges fixes", "-" + eur(a.fc || 0), true], ["-> Depenses var.", "-" + eur(a.vc || 0), true], ["-> Epargne", "-" + eur(savTotal), true], ["-> Investissements", "-" + eur(invTotal), true]].map(([l, val, dim], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0" }}>
              <span style={{ fontSize: 14, color: dim ? "var(--text3)" : "var(--text2)" }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: dim ? "var(--text2)" : "var(--text)" }}>{val}</span>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {!md.ok && <AlertBanner msg="Lancez votre premiere simulation" type="info" onClick={() => setWiz(true)} />}
      {md.ok && (
        <div onClick={() => setWiz(true)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: "var(--r2)", background: "var(--accent2)", cursor: "pointer" }} {...pressHandlers}>
          <RefreshCw size={16} color="var(--accent)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--accent)", flex: 1 }}>Relancer la simulation</span>
          <ChevronRight size={16} color="var(--accent)" style={{ opacity: 0.5 }} />
        </div>
      )}

      {ps.length > 1 && <SegTabs items={[{ v: "all", l: "Foyer" }, ...ps.map(p => ({ v: p.id, l: p.name }))]} active={v} onChange={sV} />}

      {v !== "all" ? (
        <PersonView pid={v} />
      ) : (
        <>
          <Card>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.7, margin: "0 0 8px" }}>
              Vue rapide
            </p>
            <p style={{ fontSize: 30, fontWeight: 750, letterSpacing: -1.1, margin: 0, color: tr - tf - tvs >= 0 ? "var(--green)" : "var(--red)" }}>
              {eur(tr - tf - tvs)}
            </p>
            <p style={{ fontSize: 12, color: "var(--text3)", margin: "6px 0 0" }}>
              Solde estime du mois (revenus - charges fixes - depenses variables)
            </p>
          </Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <KPI label="Revenus" value={eur(tr)} />
            <KPI label="Charges fixes" value={eur(tf)} />
          </div>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: 0 }}>Depenses variables</p>
                <p style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: -0.8, margin: "4px 0 0" }}>
                  {eur(tvs)}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text3)", marginLeft: 6 }}>/ {eur(tvb)}</span>
                </p>
              </div>
              {tvb > 0 && <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 100, background: tvs > tvb ? "var(--red2)" : "var(--green2)", color: tvs > tvb ? "var(--red)" : "var(--green)" }}>{pct(tvb > 0 ? (tvs / tvb) * 100 : 0)}</span>}
            </div>
            {tvb > 0 && <Prog val={tvs} max={tvb} h={8} />}
          </Card>
          {over.length > 0 && <AlertBanner msg={"Depassement : " + over.map(c => c.name).join(", ")} type="danger" />}
          {md.ok && ps.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: ps.filter(p => (p.type || "adult") === "adult").length > 1 ? "1fr 1fr" : "1fr", gap: 10 }}>
              {ps.filter(p => (p.type || "adult") === "adult").map(p => (
                <KPI key={p.id} label={"Reste " + p.name} value={eur(adultBalances[p.id] || 0)} color={(adultBalances[p.id] || 0) >= 0 ? "var(--green)" : "var(--red)"} />
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <KPI label="Epargne" value={eur(tSav)} color="var(--green)" onClick={() => { setPage("wealth"); setSub("sav"); }} />
            <KPI label="Invest." value={eur(tInv)} color="var(--blue)" onClick={() => { setPage("wealth"); setSub("inv"); }} />
          </div>
          {chartData.length > 0 && (
            <Card>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 16px" }}>Budget vs Reel</p>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={chartData} barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text3)" }} interval={0} angle={-35} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 9, fill: "var(--text3)" }} />
                  <Tooltip formatter={v2 => eur(v2)} contentStyle={{ borderRadius: 14, fontSize: 12, border: "none", background: "var(--card)" }} />
                  <Bar dataKey="Budget" fill="var(--accent)" opacity={0.2} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Reel" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
          {pieData.length > 0 && (
            <Card>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 16px" }}>Repartition</p>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={40} strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={v2 => eur(v2)} contentStyle={{ borderRadius: 14, fontSize: 12, border: "none", background: "var(--card)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8, justifyContent: "center" }}>
                {pieData.map(d => (
                  <span key={d.name} style={{ fontSize: 11, fontWeight: 600, color: d.color, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 4, background: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

