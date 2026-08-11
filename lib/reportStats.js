export function computeBestWorstTrade(trades) {
  if (!trades || trades.length === 0) return { best: null, worst: null };
  let best = trades[0];
  let worst = trades[0];
  for (const t of trades) {
    if (Number(t.overall_pnl) > Number(best.overall_pnl)) best = t;
    if (Number(t.overall_pnl) < Number(worst.overall_pnl)) worst = t;
  }
  return { best, worst };
}

export function computeBestWorstDay(trades) {
  if (!trades || trades.length === 0) return { bestDay: null, worstDay: null };
  const byDay = {};
  trades.forEach((t) => {
    byDay[t.date] = (byDay[t.date] || 0) + (Number(t.overall_pnl) || 0);
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
      ? arr.reduce((s, t) => s + (Number(t.overall_pnl) || 0), 0) / arr.length
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

export function computeChargesSummary(trades, dailyCharges) {
  const list = dailyCharges || [];
  const totalOverallPnl = trades.reduce((s, t) => s + (Number(t.overall_pnl) || 0), 0);
  const totalCharges = list.reduce(
    (s, c) => s + (Number(c.govt_charges) || 0) + (Number(c.brokerage) || 0),
    0
  );

  const chargesByDate = {};
  list.forEach((c) => {
    chargesByDate[c.date] = c;
  });
  const overallByDay = {};
  trades.forEach((t) => {
    overallByDay[t.date] = (overallByDay[t.date] || 0) + (Number(t.overall_pnl) || 0);
  });

  let totalNetPnl = 0;
  Object.keys(overallByDay).forEach((date) => {
    totalNetPnl += chargesByDate[date] ? Number(chargesByDate[date].net_pnl) || 0 : overallByDay[date];
  });

  const tradingDays = Object.keys(overallByDay);
  const daysWithCharges = tradingDays.filter((d) => chargesByDate[d]).length;

  return {
    totalOverallPnl: Math.round(totalOverallPnl * 100) / 100,
    totalCharges: Math.round(totalCharges * 100) / 100,
    totalNetPnl: Math.round(totalNetPnl * 100) / 100,
    daysWithCharges,
    totalTradingDays: tradingDays.length,
  };
}

function sortTradesChronologically(trades) {
  return [...trades].sort((a, b) => {
    if (a.date === b.date) {
      return (a.entry_time || "").localeCompare(b.entry_time || "");
    }
    return a.date.localeCompare(b.date);
  });
}

function computeMaxDrawdown(trades) {
  const sorted = sortTradesChronologically(trades);
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;
  let peakAtMaxDrawdown = 0;

  sorted.forEach((t) => {
    cumulative += Number(t.overall_pnl) || 0;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      peakAtMaxDrawdown = peak;
    }
  });

  const maxDrawdownPct = peakAtMaxDrawdown > 0 ? (maxDrawdown / peakAtMaxDrawdown) * 100 : 0;
  return {
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
  };
}

function computeConsecutiveStreaks(trades) {
  const sorted = sortTradesChronologically(trades);
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWinStreak = 0;
  let curLossStreak = 0;

  sorted.forEach((t) => {
    const pnl = Number(t.overall_pnl) || 0;
    if (pnl > 0) {
      curWinStreak += 1;
      curLossStreak = 0;
    } else if (pnl < 0) {
      curLossStreak += 1;
      curWinStreak = 0;
    } else {
      curWinStreak = 0;
      curLossStreak = 0;
    }
    maxWinStreak = Math.max(maxWinStreak, curWinStreak);
    maxLossStreak = Math.max(maxLossStreak, curLossStreak);
  });

  return { maxWinStreak, maxLossStreak };
}

function computeRStats(trades, riskPerTrade) {
  if (!riskPerTrade || Number(riskPerTrade) === 0 || trades.length === 0) {
    return { avgR: null, totalR: null, bestR: null, worstR: null };
  }
  const rValues = trades.map((t) => (Number(t.overall_pnl) || 0) / Number(riskPerTrade));
  const totalR = rValues.reduce((s, r) => s + r, 0);
  const avgR = totalR / trades.length;
  return {
    avgR: Math.round(avgR * 100) / 100,
    totalR: Math.round(totalR * 100) / 100,
    bestR: Math.round(Math.max(...rValues) * 100) / 100,
    worstR: Math.round(Math.min(...rValues) * 100) / 100,
  };
}

export function computePerformanceStats(trades, riskPerTrade) {
  const wins = trades.filter((t) => Number(t.overall_pnl) > 0);
  const losses = trades.filter((t) => Number(t.overall_pnl) < 0);
  const sumWins = wins.reduce((s, t) => s + Number(t.overall_pnl), 0);
  const sumLosses = losses.reduce((s, t) => s + Number(t.overall_pnl), 0); // <= 0
  const winRate = trades.length ? wins.length / trades.length : 0;
  const lossRate = trades.length ? losses.length / trades.length : 0;
  const avgWin = wins.length ? sumWins / wins.length : 0;
  const avgLoss = losses.length ? sumLosses / losses.length : 0; // negative
  const profitFactor =
    sumLosses !== 0 ? sumWins / Math.abs(sumLosses) : sumWins > 0 ? Infinity : 0;
  const expectancy = winRate * avgWin - lossRate * Math.abs(avgLoss);
  const largestWin = wins.length ? Math.max(...wins.map((t) => Number(t.overall_pnl))) : 0;
  const largestLoss = losses.length ? Math.min(...losses.map((t) => Number(t.overall_pnl))) : 0;

  return {
    profitFactor,
    expectancy: Math.round(expectancy * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    largestWin: Math.round(largestWin * 100) / 100,
    largestLoss: Math.round(largestLoss * 100) / 100,
    ...computeMaxDrawdown(trades),
    ...computeConsecutiveStreaks(trades),
    ...computeRStats(trades, riskPerTrade),
  };
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function computeDayOfWeekAnalysis(trades, riskPerTrade) {
  const byDay = {};
  WEEKDAYS.forEach((d) => {
    byDay[d] = [];
  });

  trades.forEach((t) => {
    const d = new Date(t.date);
    if (Number.isNaN(d.getTime())) return;
    const dayName = DAY_NAMES[d.getUTCDay()];
    if (byDay[dayName]) byDay[dayName].push(t);
  });

  const hasRisk = !!riskPerTrade && Number(riskPerTrade) !== 0;

  const rows = WEEKDAYS.map((day) => {
    const dayTrades = byDay[day];
    if (dayTrades.length === 0) {
      return { day, trades: 0, winRate: null, netPnl: null, avgR: null, hasData: false };
    }
    const wins = dayTrades.filter((t) => Number(t.overall_pnl) > 0).length;
    const netPnl = dayTrades.reduce((s, t) => s + (Number(t.overall_pnl) || 0), 0);
    const winRate = (wins / dayTrades.length) * 100;
    let avgR = null;
    if (hasRisk) {
      const rSum = dayTrades.reduce(
        (s, t) => s + (Number(t.overall_pnl) || 0) / Number(riskPerTrade),
        0
      );
      avgR = rSum / dayTrades.length;
    }
    return {
      day,
      trades: dayTrades.length,
      winRate: Math.round(winRate * 10) / 10,
      netPnl: Math.round(netPnl * 100) / 100,
      avgR: avgR !== null ? Math.round(avgR * 100) / 100 : null,
      hasData: true,
    };
  });

  const withData = rows.filter((r) => r.hasData);
  let bestDay = null;
  let worstDay = null;
  if (withData.length > 0) {
    bestDay = withData.reduce((a, b) => (b.netPnl > a.netPnl ? b : a));
    worstDay = withData.reduce((a, b) => (b.netPnl < a.netPnl ? b : a));
  }

  return { rows, bestDay, worstDay };
}

export function computeMistakeBreakdown(trades) {
  const map = {};
  trades.forEach((t) => {
    (t.mistake_types || []).forEach((raw) => {
      if (!raw) return;
      const m = String(raw).trim().toLowerCase();
      if (!m || m === "clean trade") return;
      if (!map[m]) map[m] = { name: m, count: 0, cost: 0 };
      map[m].count += 1;
      const pnl = Number(t.overall_pnl) || 0;
      if (pnl < 0) map[m].cost += pnl;
    });
  });
  return Object.values(map).sort((a, b) => b.count - a.count);
}
