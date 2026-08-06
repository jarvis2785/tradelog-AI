import { getWeekRange, toISODate } from "./utils";

export function computeDashboardStats(trades) {
  const today = toISODate(new Date());
  const { start: weekStart, end: weekEnd } = getWeekRange(new Date());

  const todaysTrades = trades.filter((t) => t.date === today);
  const weekTrades = trades.filter((t) => t.date >= weekStart && t.date <= weekEnd);

  const sumPnl = (arr) => arr.reduce((s, t) => s + (Number(t.net_pnl) || 0), 0);

  const todaysPnl = sumPnl(todaysTrades);
  const weekPnl = sumPnl(weekTrades);

  const totalTrades = trades.length;
  const profitableTrades = trades.filter((t) => Number(t.net_pnl) > 0).length;
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
    const pnl = Number(chronological[i].net_pnl) || 0;
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
    weekPnl,
    winRate,
    totalTrades,
    ruleCompliance,
    streakLabel,
    streakType,
  };
}

export function computeWeeklyChartData(trades) {
  const { start } = getWeekRange(new Date());
  const monday = new Date(start);
  const days = [];
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = toISODate(d);
    const dayTrades = trades.filter((t) => t.date === iso);
    const pnl = dayTrades.reduce((s, t) => s + (Number(t.net_pnl) || 0), 0);
    days.push({ day: labels[i], date: iso, pnl: Math.round(pnl * 100) / 100 });
  }
  return days;
}
