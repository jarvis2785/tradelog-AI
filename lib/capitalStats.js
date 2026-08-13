function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function computeNetPnlByDate(trades, dailyCharges) {
  const chargesByDate = {};
  (dailyCharges || []).forEach((c) => {
    chargesByDate[c.date] = c;
  });

  const overallByDate = {};
  (trades || []).forEach((t) => {
    overallByDate[t.date] = (overallByDate[t.date] || 0) + (Number(t.overall_pnl) || 0);
  });

  const netByDate = {};
  Object.keys(overallByDate).forEach((date) => {
    netByDate[date] = chargesByDate[date]
      ? Number(chargesByDate[date].net_pnl) || 0
      : overallByDate[date];
  });
  return netByDate;
}

export function computeEquityCurve(transactions, netPnlByDate) {
  const list = transactions || [];
  const initial = list.find((t) => t.type === "initial_capital");
  if (!initial) return [];

  // Replay the full history from the earliest date on record — trading P&L can
  // predate the initial_capital transaction (set up retroactively) and must still
  // show on the curve, not just capital-transaction dates from that point forward.
  const dateSet = new Set();
  list.forEach((t) => dateSet.add(t.date));
  Object.keys(netPnlByDate || {}).forEach((d) => dateSet.add(d));
  const sortedDates = Array.from(dateSet).sort();

  const txByDate = {};
  list.forEach((t) => {
    (txByDate[t.date] = txByDate[t.date] || []).push(t);
  });

  let cumulative = 0;
  const curve = [];
  sortedDates.forEach((date) => {
    (txByDate[date] || []).forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "initial_capital") cumulative += amt;
      else if (t.type === "capital_added") cumulative += amt;
      else if (t.type && t.type.startsWith("withdrawal_")) cumulative -= amt;
      else if (t.type === "adjustment") cumulative += amt;
    });
    cumulative += (netPnlByDate || {})[date] || 0;
    curve.push({ date, value: round2(cumulative) });
  });

  return curve;
}

export function computeCapitalMetrics(transactions, netPnlByDate) {
  const list = transactions || [];
  const initial = list.find((t) => t.type === "initial_capital");
  const hasStartingCapital = !!initial;
  const startingCapital = initial ? Number(initial.amount) || 0 : 0;

  const totalDeposited = list
    .filter((t) => t.type === "capital_added")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const totalWithdrawn = list
    .filter((t) => t.type && t.type.startsWith("withdrawal_"))
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const totalAdjustments = list
    .filter((t) => t.type === "adjustment")
    .reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const totalTradingPnl = Object.values(netPnlByDate || {}).reduce(
    (s, v) => s + (Number(v) || 0),
    0
  );

  const currentValue =
    startingCapital + totalDeposited - totalWithdrawn + totalAdjustments + totalTradingPnl;

  const equityCurve = computeEquityCurve(list, netPnlByDate || {});
  const peakCapital =
    equityCurve.length > 0 ? Math.max(...equityCurve.map((p) => p.value)) : startingCapital;

  const drawdownAmount = Math.max(0, peakCapital - currentValue);
  const drawdownPercent = peakCapital > 0 ? (drawdownAmount / peakCapital) * 100 : 0;
  const totalInvested = startingCapital + totalDeposited;
  const tradingReturn = totalInvested > 0 ? (totalTradingPnl / totalInvested) * 100 : 0;
  const accountGrowth = startingCapital > 0 ? ((currentValue - startingCapital) / startingCapital) * 100 : 0;

  return {
    hasStartingCapital,
    startingCapital: round2(startingCapital),
    totalDeposited: round2(totalDeposited),
    totalWithdrawn: round2(totalWithdrawn),
    totalAdjustments: round2(totalAdjustments),
    totalTradingPnl: round2(totalTradingPnl),
    currentValue: round2(currentValue),
    peakCapital: round2(peakCapital),
    drawdownAmount: round2(drawdownAmount),
    drawdownPercent: round2(drawdownPercent),
    tradingReturn: round2(tradingReturn),
    accountGrowth: round2(accountGrowth),
    totalInvested: round2(totalInvested),
    equityCurve,
  };
}
