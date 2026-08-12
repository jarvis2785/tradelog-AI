"use client";

import { formatCurrency } from "@/lib/utils";

export default function CapitalOverview({ metrics }) {
  const {
    currentValue,
    startingCapital,
    totalInvested,
    totalTradingPnl,
    totalWithdrawn,
    peakCapital,
    drawdownAmount,
    drawdownPercent,
    overallReturn,
  } = metrics;

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Capital Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        <MetricTile
          label="Current Account Value"
          value={formatCurrency(currentValue)}
          tone={currentValue >= startingCapital ? "profit" : "loss"}
          large
        />
        <MetricTile
          label="Overall Return"
          value={`${overallReturn >= 0 ? "+" : ""}${overallReturn.toFixed(1)}%`}
          tone={overallReturn >= 0 ? "profit" : "loss"}
          large
        />

        <MetricTile label="Starting Capital" value={formatCurrency(startingCapital)} />
        <MetricTile label="Total Invested" value={formatCurrency(totalInvested)} />

        <MetricTile
          label="Total Trading P&L"
          value={formatCurrency(totalTradingPnl)}
          tone={totalTradingPnl >= 0 ? "profit" : "loss"}
        />
        <MetricTile label="Total Withdrawn" value={formatCurrency(totalWithdrawn)} />

        <MetricTile label="Peak Capital" value={formatCurrency(peakCapital)} />
        <MetricTile
          label="Current Drawdown"
          value={`${formatCurrency(drawdownAmount)} (${drawdownPercent.toFixed(1)}%)`}
          tone="loss"
        />
      </div>
    </div>
  );
}

function MetricTile({ label, value, tone, large }) {
  const toneClass =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div className="border border-border rounded-control px-3.5 py-3">
      <p className="text-small text-text-muted mb-1">{label}</p>
      <p
        className={`font-mono font-semibold truncate ${
          large ? "text-h3 sm:text-h2" : "text-body"
        } ${toneClass}`}
      >
        {value}
      </p>
    </div>
  );
}
