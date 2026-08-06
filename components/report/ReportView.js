"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, Target } from "lucide-react";
import { formatCurrency, toDDMMYYYY } from "@/lib/utils";
import { parseReportSections, parseListItems } from "@/lib/reportParser";
import {
  computeBestWorstTrade,
  computeBestWorstDay,
  computeDisciplinedVsImpulsive,
  computeMistakeBreakdown,
} from "@/lib/reportStats";
import CircularProgress from "./CircularProgress";

export default function ReportView({ report, trades }) {
  const sections = useMemo(() => parseReportSections(report.report_content), [report.report_content]);

  const { best, worst } = useMemo(() => computeBestWorstTrade(trades), [trades]);
  const { bestDay, worstDay } = useMemo(() => computeBestWorstDay(trades), [trades]);
  const disciplined = useMemo(() => computeDisciplinedVsImpulsive(trades), [trades]);
  const mistakeBreakdown = useMemo(() => computeMistakeBreakdown(trades), [trades]);

  const cleanTrades = report.total_trades - report.rule_violations;
  const compliancePct = report.total_trades > 0 ? (cleanTrades / report.total_trades) * 100 : 0;
  const maxMistakeCount = Math.max(1, ...mistakeBreakdown.map((m) => m.count));

  const strengths = parseListItems(sections["TOP 3 STRENGTHS"]);
  const weaknesses = parseListItems(sections["TOP 3 WEAKNESSES"]);
  const goals = parseListItems(sections["3 GOALS FOR NEXT WEEK"]);

  return (
    <div id="report-content" className="flex flex-col gap-5">
      {/* 1. Performance Summary */}
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Performance Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryStat label="Total Trades" value={report.total_trades} />
          <SummaryStat label="Win Rate" value={`${report.win_rate.toFixed(1)}%`} />
          <SummaryStat
            label="Net P&L"
            value={formatCurrency(report.net_pnl)}
            tone={report.net_pnl >= 0 ? "profit" : "loss"}
          />
          <SummaryStat
            label="Best Trade"
            value={best ? formatCurrency(best.net_pnl) : "—"}
            tone="profit"
          />
          <SummaryStat
            label="Worst Trade"
            value={worst ? formatCurrency(worst.net_pnl) : "—"}
            tone="loss"
          />
          <SummaryStat label="Avg P&L / Trade" value={formatCurrency(report.total_trades ? report.net_pnl / report.total_trades : 0)} />
        </div>
      </div>

      {/* 2. Rule Compliance Score */}
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Rule Compliance Score</h3>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <CircularProgress
            percent={compliancePct}
            color={compliancePct >= 70 ? "#22c55e" : compliancePct >= 40 ? "#f59e0b" : "#ef4444"}
          />
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <SummaryStat label="Clean Trades" value={cleanTrades} tone="profit" />
            <SummaryStat label="Rule Violations" value={report.rule_violations} tone="loss" />
          </div>
        </div>
      </div>

      {/* 3. Mistake Breakdown */}
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Mistake Breakdown</h3>
        {mistakeBreakdown.length === 0 ? (
          <p className="text-body text-text-secondary">No mistakes recorded this week. Clean.</p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {mistakeBreakdown.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body text-text-primary font-medium">{m.name}</span>
                  <span className="text-small text-text-secondary font-mono">
                    {m.count}x · {formatCurrency(m.cost)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-loss rounded-full"
                    style={{ width: `${(m.count / maxMistakeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Best Day vs Worst Day */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-small text-text-secondary mb-2">Best Day</p>
          {bestDay ? (
            <>
              <p className="font-mono text-h2 text-profit">{formatCurrency(bestDay.pnl)}</p>
              <p className="text-small text-text-muted mt-1">{toDDMMYYYY(bestDay.date)}</p>
            </>
          ) : (
            <p className="text-body text-text-muted">—</p>
          )}
        </div>
        <div className="card">
          <p className="text-small text-text-secondary mb-2">Worst Day</p>
          {worstDay ? (
            <>
              <p className="font-mono text-h2 text-loss">{formatCurrency(worstDay.pnl)}</p>
              <p className="text-small text-text-muted mt-1">{toDDMMYYYY(worstDay.date)}</p>
            </>
          ) : (
            <p className="text-body text-text-muted">—</p>
          )}
        </div>
      </div>

      {/* 5. Disciplined vs Impulsive */}
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">Disciplined vs Impulsive</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="border border-border rounded-control p-3.5">
            <p className="text-small text-text-secondary mb-1">
              Clean Trades ({disciplined.cleanCount})
            </p>
            <p className="font-mono text-h3 text-profit">{formatCurrency(disciplined.cleanAvg)}</p>
            <p className="text-small text-text-muted mt-0.5">avg P&L</p>
          </div>
          <div className="border border-border rounded-control p-3.5">
            <p className="text-small text-text-secondary mb-1">
              Rule-Broken ({disciplined.violatedCount})
            </p>
            <p className="font-mono text-h3 text-loss">{formatCurrency(disciplined.violatedAvg)}</p>
            <p className="text-small text-text-muted mt-0.5">avg P&L</p>
          </div>
        </div>
        <div className="rounded-control bg-accent/[0.06] border border-accent/30 px-3.5 py-3">
          <p className="text-small text-text-secondary">
            Difference:{" "}
            <span className="font-mono font-semibold text-accent">
              {formatCurrency(disciplined.difference)}
            </span>{" "}
            per trade when disciplined.
          </p>
        </div>
      </div>

      {/* 6 & 7. Strengths / Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-h3 text-text-primary mb-4">Top 3 Strengths</h3>
          <ul className="flex flex-col gap-3">
            {(strengths.length ? strengths : ["No standout strengths identified."]).map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-profit shrink-0 mt-0.5" />
                <span className="text-body text-text-secondary leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 className="text-h3 text-text-primary mb-4">Top 3 Weaknesses</h3>
          <ul className="flex flex-col gap-3">
            {(weaknesses.length ? weaknesses : ["No major weaknesses identified."]).map((w, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="text-loss shrink-0 mt-0.5" />
                <span className="text-body text-text-secondary leading-relaxed">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 8. Goals for Next Week */}
      <div className="card">
        <h3 className="text-h3 text-text-primary mb-4">3 Goals for Next Week</h3>
        <ol className="flex flex-col gap-3">
          {(goals.length ? goals : ["Keep logging trades daily to build a report."]).map((g, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-accent/15 text-accent text-small font-semibold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-body text-text-secondary leading-relaxed pt-0.5">{g}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, tone }) {
  const toneClass =
    tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-text-primary";
  return (
    <div className="border border-border rounded-control px-3 py-2.5">
      <p className="text-small text-text-muted mb-0.5">{label}</p>
      <p className={`font-mono text-body font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
