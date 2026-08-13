"use client";

import { Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CapitalOverview({ metrics, onEditStartingCapital }) {
  const {
    currentValue,
    startingCapital,
    totalInvested,
    totalTradingPnl,
    totalWithdrawn,
    peakCapital,
    drawdownAmount,
    drawdownPercent,
    tradingReturn,
    accountGrowth,
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
          label="Trading Return"
          hint="trading P&L vs capital invested"
          value={`${tradingReturn >= 0 ? "+" : ""}${tradingReturn.toFixed(1)}%`}
          tone={tradingReturn >= 0 ? "profit" : "loss"}
          large
        />

        <MetricTile
          label="Account Growth"
          hint="account size incl. withdrawals"
          value={`${accountGrowth >= 0 ? "+" : ""}${accountGrowth.toFixed(1)}%`}
          tone={accountGrowth >= 0 ? "profit" : "loss"}
        />
        <MetricTile
          label="Starting Capital"
          value={formatCurrency(startingCapital)}
          onEdit={onEditStartingCapital}
        />

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
          className="col-span-2"
        />
      </div>
    </div>
  );
}

function MetricTile({ label, hint, value, tone, large, className = "", onEdit }) {
  const toneClass =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div className={`border border-border rounded-control px-3.5 py-3 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-small text-text-muted">{label}</p>
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-6 h-6 flex items-center justify-center rounded-control text-text-muted hover:text-text-primary hover:bg-overlay/[0.06] transition-colors shrink-0"
            aria-label="Edit starting capital"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
      <p
        className={`font-mono font-semibold truncate ${
          large ? "text-h3 sm:text-h2" : "text-body"
        } ${toneClass}`}
      >
        {value}
      </p>
      {hint && <p className="text-small text-text-muted mt-0.5">{hint}</p>}
    </div>
  );
}
