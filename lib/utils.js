export function formatCurrency(value) {
  const num = Number(value ?? 0);
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  return `${sign}₹${abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCompactCurrency(value) {
  const num = Number(value ?? 0);
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  return `${sign}₹${abs.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function toDDMMYYYY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function toISODate(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toISODate(monday), end: toISODate(sunday) };
}

export function getLastNWeeks(n = 8) {
  const weeks = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const ref = new Date(today);
    ref.setDate(today.getDate() - i * 7);
    weeks.push(getWeekRange(ref));
  }
  return weeks;
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function calculateRiskReward(buyAvg, target, stopLoss) {
  const buy = Number(buyAvg);
  const t = Number(target);
  const sl = Number(stopLoss);
  if (!buy || !t || !sl || buy - sl === 0) return null;
  const rr = (t - buy) / (buy - sl);
  return Math.round(rr * 100) / 100;
}
