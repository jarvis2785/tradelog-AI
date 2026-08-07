import { getWeekRange, toISODate } from "./utils";

export function computeDashboardStats(trades, dailyCharges = []) {
  const today = toISODate(new Date());
  const { start: weekStart, end: weekEnd } = getWeekRange(new Date());

  const todaysTrades = trades.filter((t) => t.date === today);
  const weekTrades = trades.filter((t) => t.date >= weekStart && t.date <= weekEnd);

  const sumPnl = (arr) => arr.reduce((s, t) => s + (Number(t.overall_pnl) || 0), 0);

  const todaysPnl = sumPnl(todaysTrades);

  const chargesByDate = {};
  dailyCharges.forEach((c) => {
    chargesByDate[c.date] = c;
  });

  const todaysCharges = chargesByDate[today] || null;
  const todaysNetPnl = todaysCharges ? Number(todaysCharges.net_pnl) : null;

  const weekOverallByDay = {};
  weekTrades.forEach((t) => {
    weekOverallByDay[t.date] = (weekOverallByDay[t.date] || 0) + (Number(t.overall_pnl) || 0);
  });
  const weekTradingDates = Object.keys(weekOverallByDay);
  let weekPnl = 0;
  weekTradingDates.forEach((date) => {
    weekPnl += chargesByDate[date] ? Number(chargesByDate[date].net_pnl) || 0 : weekOverallByDay[date];
  });
  const weekDaysWithCharges = weekTradingDates.filter((d) => chargesByDate[d]).length;

  const totalTrades = trades.length;
  const profitableTrades = trades.filter((t) => Number(t.overall_pnl) > 0).length;
  const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

  const cleanTrades = trades.filter((t) => !t.rule_broken).length;
  const ruleCompliance = totalTrades > 0 ? (cleanTrades / totalTrades) * 100 : 0;

  const chronological = [...trades].sort((a, b) => {
    if (a.date === b.date) return (a.created_at || "").localeCompare(b.created_at || "");
    return a.date.localeCompare(b.date);
  });

  let streakCount = 0;
  let streakType = null;
  for (let i = chronological.length - 1; i >= 0; i--) {
    const pnl = Number(chronological[i].overall_pnl) || 0;
    const type = pnl >= 0 ? "W" : "L";
    if (streakType === null) {
      streakType = type;
      streakCount = 1;
    } else if (type === streakType) {
      streakCount++;
    } else {
      break;
    }
  }
  const streakLabel = totalTrades > 0 ? `${streakCount}${streakType}` : "—";

  return {
    todaysPnl,
    todaysNetPnl,
    weekPnl,
    weekDaysWithCharges,
    weekTradingDays: weekTradingDates.length,
    winRate,
    totalTrades,
    ruleCompliance,
    streakLabel,
    streakType,
  };
}

export function computeWeeklyChartData(trades, dailyCharges = []) {
  const { start } = getWeekRange(new Date());
  const monday = new Date(start);
  const days = [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const chargesByDate = {};
  dailyCharges.forEach((c) => {
    chargesByDate[c.date] = c;
  });

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISODate(d);
    const dayTrades = trades.filter((t) => t.date === iso);
    const overallPnl = dayTrades.reduce((s, t) => s + (Number(t.overall_pnl) || 0), 0);
    const pnl = chargesByDate[iso] ? Number(chargesByDate[iso].net_pnl) || 0 : overallPnl;
    days.push({ day: labels[i], date: iso, pnl: Math.round(pnl * 100) / 100 });
  }
  return days;
}
