"use client";

import { formatCurrency, formatRMultiple, classNames } from "@/lib/utils";

export default function DayOfWeekAnalysis({ analysis }) {
  const { rows, bestDay, worstDay } = analysis;

  return (
    <div className="card">
      <h3 className="text-h3 text-text-primary mb-4">Day of Week Analysis</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-small border-b border-border text-text-muted">
              <th className="py-2 px-0.5 font-medium whitespace-nowrap">Day</th>
              <th className="py-2 px-0.5 font-medium text-right whitespace-nowrap">Trades</th>
              <th className="py-2 px-0.5 font-medium text-right whitespace-nowrap">Win Rate</th>
              <th className="py-2 px-0.5 font-medium text-right whitespace-nowrap">Net P&L</th>
              <th className="py-2 px-0.5 font-medium text-right whitespace-nowrap">Avg R</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isBest = !!bestDay && row.day === bestDay.day;
              const isWorst = !!worstDay && row.day === worstDay.day && !isBest;
              return (
                <tr
                  key={row.day}
                  className={classNames(
                    "border-b border-border last:border-0 text-body",
                    isBest && "bg-profit/[0.07]",
                    isWorst && "bg-loss/[0.07]"
                  )}
                >
                  <td className="py-2.5 px-0.5 text-text-primary font-medium whitespace-nowrap">
                    {row.day}
                  </td>
                  <td className="py-2.5 px-0.5 text-right font-mono text-text-secondary whitespace-nowrap">
                    {row.hasData ? row.trades : "—"}
                  </td>
                  <td className="py-2.5 px-0.5 text-right font-mono text-text-secondary whitespace-nowrap">
                    {row.hasData ? `${row.winRate.toFixed(0)}%` : "—"}
                  </td>
                  <td
                    className={`py-2.5 px-0.5 text-right font-mono font-semibold whitespace-nowrap ${
                      !row.hasData
                        ? "text-text-secondary"
                        : row.netPnl >= 0
                        ? "text-profit"
                        : "text-loss"
                    }`}
                  >
                    {row.hasData ? formatCurrency(row.netPnl) : "—"}
                  </td>
                  <td
                    className={`py-2.5 px-0.5 text-right font-mono whitespace-nowrap ${
                      !row.hasData || row.avgR == null
                        ? "text-text-secondary"
                        : row.avgR >= 0
                        ? "text-profit"
                        : "text-loss"
                    }`}
                  >
                    {row.hasData ? formatRMultiple(row.avgR) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(bestDay || worstDay) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="border border-profit/30 bg-profit/[0.06] rounded-control px-3.5 py-3">
            <p className="text-small text-text-secondary mb-1">
              Best Day{bestDay ? `: ${bestDay.day}` : ""}
            </p>
            {bestDay ? (
              <>
                <p className="font-mono text-h3 text-profit">{formatCurrency(bestDay.netPnl)}</p>
                <p className="text-small text-text-muted mt-0.5">
                  {bestDay.winRate.toFixed(0)}% win rate
                </p>
              </>
            ) : (
              <p className="text-body text-text-muted">—</p>
            )}
          </div>
          <div className="border border-loss/30 bg-loss/[0.06] rounded-control px-3.5 py-3">
            <p className="text-small text-text-secondary mb-1">
              Worst Day{worstDay ? `: ${worstDay.day}` : ""}
            </p>
            {worstDay ? (
              <>
                <p className="font-mono text-h3 text-loss">{formatCurrency(worstDay.netPnl)}</p>
                <p className="text-small text-text-muted mt-0.5">
                  {worstDay.winRate.toFixed(0)}% win rate
                </p>
              </>
            ) : (
              <p className="text-body text-text-muted">—</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
