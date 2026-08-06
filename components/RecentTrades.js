import Link from "next/link";
import { toDDMMYYYY, formatCurrency } from "@/lib/utils";
import { MistakePill, RuleBrokenBadge } from "@/components/Badge";

export default function RecentTrades({ trades }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h3 text-text-primary">Recent Trades</h3>
        <Link
          href="/history"
          className="text-small text-accent hover:text-accent-hover font-medium transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-small text-text-muted border-b border-border">
              <th className="font-medium py-2.5 pr-4">Date</th>
              <th className="font-medium py-2.5 pr-4">Stock</th>
              <th className="font-medium py-2.5 pr-4">P&L</th>
              <th className="font-medium py-2.5 pr-4">Mistakes</th>
              <th className="font-medium py-2.5">Rule Broken</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <td className="py-3 pr-4 text-body text-text-secondary whitespace-nowrap">
                  {toDDMMYYYY(t.date)}
                </td>
                <td className="py-3 pr-4 text-body text-text-primary font-medium whitespace-nowrap">
                  {t.stock_name}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`font-mono text-body font-semibold ${
                      Number(t.net_pnl) >= 0 ? "text-profit" : "text-loss"
                    }`}
                  >
                    {formatCurrency(t.net_pnl)}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1.5">
                    {(t.mistake_types || [])
                      .filter((m) => m && m.toLowerCase() !== "clean trade")
                      .slice(0, 2)
                      .map((m) => (
                        <MistakePill key={m} label={m} />
                      ))}
                  </div>
                </td>
                <td className="py-3">
                  <RuleBrokenBadge broken={t.rule_broken} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {trades.map((t) => (
          <div
            key={t.id}
            className="border border-border rounded-control p-3.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body font-medium text-text-primary">
                  {t.stock_name}
                </p>
                <p className="text-small text-text-muted mt-0.5">
                  {toDDMMYYYY(t.date)}
                </p>
              </div>
              <span
                className={`font-mono text-body font-semibold ${
                  Number(t.net_pnl) >= 0 ? "text-profit" : "text-loss"
                }`}
              >
                {formatCurrency(t.net_pnl)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {(t.mistake_types || [])
                .filter((m) => m && m.toLowerCase() !== "clean trade")
                .map((m) => (
                  <MistakePill key={m} label={m} />
                ))}
              {t.rule_broken && <RuleBrokenBadge broken />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
