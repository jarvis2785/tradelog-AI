"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

function signedCurrency(value) {
  const num = Number(value) || 0;
  return num >= 0 ? `+${formatCurrency(num)}` : formatCurrency(num);
}

export default function CapitalSummaryCard({ capital }) {
  if (!capital || !capital.hasStartingCapital) {
    return (
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-2">Capital Summary</h3>
        <p className="text-body text-text-secondary">
          Set up your trading account in the{" "}
          <Link href="/accounts" className="text-accent hover:underline">
            Accounts
          </Link>{" "}
          section to see capital tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Capital Summary</h3>
      <div className="flex flex-col gap-2.5">
        <Row label="Starting Capital" value={formatCurrency(capital.startingCapital)} />
        <Row label="Total Deposited" value={formatCurrency(capital.totalDeposited)} />
        <Row
          label="Total Trading P&L"
          value={signedCurrency(capital.totalTradingPnl)}
          tone={capital.totalTradingPnl >= 0 ? "profit" : "loss"}
        />
        <Row
          label="Total Withdrawn"
          value={`-${formatCurrency(capital.totalWithdrawn)}`}
          tone="loss"
        />
        <div className="border-t border-border pt-2.5 flex flex-col gap-2.5">
          <Row
            label="Current Account Value"
            value={formatCurrency(capital.currentValue)}
            tone={capital.currentValue >= capital.startingCapital ? "profit" : "loss"}
            bold
          />
          <Row
            label="Trading Return"
            hint="trading P&L vs capital invested — unaffected by withdrawals"
            value={`${capital.tradingReturn >= 0 ? "+" : ""}${capital.tradingReturn.toFixed(1)}%`}
            tone={capital.tradingReturn >= 0 ? "profit" : "loss"}
            bold
          />
          <Row
            label="Account Growth"
            hint="account size change, including deposits and withdrawals"
            value={`${capital.accountGrowth >= 0 ? "+" : ""}${capital.accountGrowth.toFixed(1)}%`}
            tone={capital.accountGrowth >= 0 ? "profit" : "loss"}
            bold
          />
          <Row label="Peak Capital" value={formatCurrency(capital.peakCapital)} />
          <Row
            label="Max Drawdown from Peak"
            value={`${formatCurrency(capital.drawdownAmount)} (${capital.drawdownPercent.toFixed(1)}%)`}
            tone="loss"
          />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, tone, bold, hint }) {
  const toneClass =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-body ${bold ? "font-medium text-text-primary" : "text-text-secondary"}`}>
          {label}
        </span>
        <span
          className={`font-mono ${bold ? "text-h3 font-semibold" : "text-body font-semibold"} ${toneClass}`}
        >
          {value}
        </span>
      </div>
      {hint && <p className="text-small text-text-muted mt-0.5">{hint}</p>}
    </div>
  );
}
