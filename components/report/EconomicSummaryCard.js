"use client";

import Link from "next/link";
import { formatCurrency, computeEconomicPnl } from "@/lib/utils";

export default function EconomicSummaryCard({ reportType, monthLabel, netTradingPnl, operatingExpenses }) {
  const title = reportType === "overall" ? "Economic Summary (All Time)" : "Economic Summary";

  if (!operatingExpenses || !operatingExpenses.hasData) {
    return (
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-2">{title}</h3>
        <p className="text-body text-text-secondary">
          No operating expenses recorded{reportType === "monthly" ? ` for ${monthLabel}` : " yet"}.
          Add them in{" "}
          <Link href="/profile" className="text-accent hover:underline">
            Profile → Monthly Operating Expenses
          </Link>
          .
        </p>
      </div>
    );
  }

  const economic = computeEconomicPnl(netTradingPnl, operatingExpenses.total);

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">{title}</h3>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-body text-text-secondary">Net Trading P&L</span>
          <span
            className={`font-mono text-body font-semibold ${
              economic.netTradingPnl >= 0 ? "text-profit" : "text-loss"
            }`}
          >
            {formatCurrency(economic.netTradingPnl)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body text-text-secondary">Operating Expenses</span>
          <span className="font-mono text-body font-semibold text-loss">
            {formatCurrency(economic.operatingExpenses)}
          </span>
        </div>
        <div className="border-t border-border pt-2.5 flex items-center justify-between">
          <span className="text-body font-medium text-text-primary">Economic P&L</span>
          <span
            className={`font-mono text-h3 font-semibold ${
              economic.isProfitable ? "text-profit" : "text-loss"
            }`}
          >
            {formatCurrency(economic.economicPnl)}
          </span>
        </div>
      </div>
    </div>
  );
}
