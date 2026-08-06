export function computeBestWorstTrade(trades) {
  if (!trades || trades.length === 0) return { best: null, worst: null };
  let best = trades[0];
  let worst = trades[0];
  for (const t of trades) {
    if (Number(t.net_pnl) > Number(best.net_pnl)) best = t;
    if (Number(t.net_pnl) < Number(worst.net_pnl)) worst = t;
  }
  return { best, worst };
}

export function computeBestWorstDay(trades) {
  if (!trades || trades.length === 0) return { bestDay: null, worstDay: null };
  const byDay = {};
  trades.forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + (Number(t.net_pnl) || 0);
  });
  const entries = Object.entries(byDay).map(([date, pnl]) => ({
    date,
    pnl: Math.round(pnl * 100) / 100,
  }));
  if (entries.length === 0) return { bestDay: null, worstDay: null };
  let bestDay = entries[0];
  let worstDay = entries[0];
  for (const e of entries) {
    if (e.pnl > bestDay.pnl) bestDay = e;
    if (e.pnl < worstDay.pnl) worstDay = e;
  }
  return { bestDay, worstDay };
}

export function computeDisciplinedVsImpulsive(trades) {
  const clean = trades.filter((t) => !t.rule_broken);
  const violated = trades.filter((t) => t.rule_broken);
  const avg = (arr) =>
    arr.length > 0
      ? arr.reduce((s, t) => s + (Number(t.net_pnl) || 0), 0) / arr.length
      : 0;
  const cleanAvg = Math.round(avg(clean) * 100) / 100;
  const violatedAvg = Math.round(avg(violated) * 100) / 100;
  return {
    cleanAvg,
    violatedAvg,
    difference: Math.round((cleanAvg - violatedAvg) * 100) / 100,
    cleanCount: clean.length,
    violatedCount: violated.length,
  };
}

export function computeMistakeBreakdown(trades) {
  const map = {};
  trades.forEach((t) => {
    (t.mistake_types || []).forEach((m) => {
      if (!m || m.toLowerCase() === "clean trade") return;
      if (!map[m]) map[m] = { name: m, count: 0, cost: 0 };
      map[m].count += 1;
      const pnl = Number(t.net_pnl) || 0;
      if (pnl < 0) map[m].cost += pnl;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}
