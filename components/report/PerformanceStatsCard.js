"use client";

import { formatCurrency, formatRMultiple } from "@/lib/utils";

function toneForR(value) {
  if (value == null) return "neutral";
  return value >= 0 ? "profit" : "loss";
}

export default function PerformanceStatsCard({ stats }) {
  const pfDisplay =
    stats.profitFactor === Infinity ? "∞" : `${stats.profitFactor.toFixed(1)}x`;
  const pfTone =
    stats.profitFactor === Infinity || stats.profitFactor >= 1
      ? "profit"
      : stats.profitFactor > 0
      ? "loss"
      : "neutral";

  const tiles = [
    { label: "Profit Factor", value: pfDisplay, tone: pfTone },
    {
      label: "Expectancy",
      value: formatCurrency(stats.expectancy),
      tone: stats.expectancy >= 0 ? "profit" : "loss",
    },
    { label: "Avg Winning Trade", value: formatCurrency(stats.avgWin), tone: "profit" },
    { label: "Avg Losing Trade", value: formatCurrency(stats.avgLoss), tone: "loss" },
    { label: "Largest Win", value: formatCurrency(stats.largestWin), tone: "profit" },
    { label: "Largest Loss", value: formatCurrency(stats.largestLoss), tone: "loss" },
    {
      label: "Max Drawdown",
      value: `${formatCurrency(stats.maxDrawdown)} (${stats.maxDrawdownPct.toFixed(1)}%)`,
      tone: stats.maxDrawdown > 0 ? "loss" : "neutral",
    },
    { label: "Consecutive Wins", value: stats.maxWinStreak, tone: "profit" },
    { label: "Consecutive Losses", value: stats.maxLossStreak, tone: "loss" },
    { label: "Average R", value: formatRMultiple(stats.avgR), tone: toneForR(stats.avgR) },
    { label: "Total R", value: formatRMultiple(stats.totalR), tone: toneForR(stats.totalR) },
    { label: "Best R Trade", value: formatRMultiple(stats.bestR), tone: toneForR(stats.bestR) },
    { label: "Worst R Trade", value: formatRMultiple(stats.worstR), tone: toneForR(stats.worstR) },
  ];

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Performance Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </div>
    </div>
  );
}

function StatTile({ label, value, tone }) {
  const toneClass =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div className="border border-border rounded-control px-3 py-2.5">
      <p className="text-small text-text-muted mb-0.5">{label}</p>
      <p className={`font-mono text-body font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
