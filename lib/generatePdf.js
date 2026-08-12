import jsPDF from "jspdf";
import { formatCurrency, toDDMMYYYY, formatRMultiple, computeEconomicPnl } from "./utils";
import { parseReportSections, parseListItems, goalsHeaderForType } from "./reportParser";
import {
  computeBestWorstTrade,
  computeBestWorstDay,
  computeDisciplinedVsImpulsive,
  computeMistakeBreakdown,
  computeChargesSummary,
  computePerformanceStats,
  computeDayOfWeekAnalysis,
} from "./reportStats";

const REPORT_TITLE = {
  weekly: "Weekly Report",
  monthly: "Monthly Report",
  overall: "All-Time Report",
};

const MARGIN = 44;
const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generateReportPdf(
  report,
  trades,
  dailyCharges = [],
  riskPerTrade = null,
  operatingExpenses = null
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  function ensureSpace(height) {
    if (y + height > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function heading(text, size = 14) {
    ensureSpace(size + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, MARGIN, y);
    y += size + 10;
  }

  function paragraph(text, size = 10) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    lines.forEach((line) => {
      ensureSpace(size + 4);
      doc.text(line, MARGIN, y);
      y += size + 4;
    });
    y += 6;
  }

  function statLine(label, value) {
    ensureSpace(16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(String(value), MARGIN + 180, y);
    y += 16;
  }

  function divider() {
    ensureSpace(16);
    doc.setDrawColor(220, 220, 220);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 16;
  }

  const reportType = report.report_type || "weekly";
  const dateRangeLabel =
    reportType === "monthly"
      ? report.month_year || ""
      : reportType === "overall"
      ? "All Time"
      : `${toDDMMYYYY(report.week_start)} — ${toDDMMYYYY(report.week_end)}`;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text(`TradeLog AI — ${REPORT_TITLE[reportType] || REPORT_TITLE.weekly}`, MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(dateRangeLabel, MARGIN, y);
  y += 26;

  divider();

  const sections = parseReportSections(report.report_content);
  const goalsHeader = goalsHeaderForType(reportType);
  const periodText =
    reportType === "monthly" ? "this month" : reportType === "overall" ? "all time" : "this week";
  const { best, worst } = computeBestWorstTrade(trades);
  const { bestDay, worstDay } = computeBestWorstDay(trades);
  const disciplined = computeDisciplinedVsImpulsive(trades);
  const mistakeBreakdown = computeMistakeBreakdown(trades);
  const chargesSummary = computeChargesSummary(trades, dailyCharges);
  const performanceStats = computePerformanceStats(trades, riskPerTrade);
  const dayOfWeek = computeDayOfWeekAnalysis(trades, riskPerTrade);
  const cleanTrades = report.total_trades - report.rule_violations;
  const compliancePct = report.total_trades > 0 ? (cleanTrades / report.total_trades) * 100 : 0;

  heading("Performance Summary");
  statLine("Total Trades", report.total_trades);
  statLine("Win Rate", `${report.win_rate.toFixed(1)}%`);
  statLine("Overall P&L", formatCurrency(chargesSummary.totalOverallPnl));
  statLine("Net P&L", formatCurrency(report.net_pnl));
  statLine("Best Trade", best ? formatCurrency(best.overall_pnl) : "—");
  statLine("Worst Trade", worst ? formatCurrency(worst.overall_pnl) : "—");
  statLine("Total Charges Paid", formatCurrency(chargesSummary.totalCharges));
  y += 8;

  if (reportType !== "weekly") {
    const summaryTitle = reportType === "overall" ? "Economic Summary (All Time)" : "Economic Summary";
    heading(summaryTitle);
    if (!operatingExpenses || !operatingExpenses.hasData) {
      paragraph(
        `No operating expenses recorded${
          reportType === "monthly" ? ` for ${report.month_year || ""}` : " yet"
        }.`
      );
    } else {
      const economic = computeEconomicPnl(report.net_pnl, operatingExpenses.total);
      statLine("Net Trading P&L", formatCurrency(economic.netTradingPnl));
      statLine("Operating Expenses", formatCurrency(economic.operatingExpenses));
      statLine("Economic P&L", formatCurrency(economic.economicPnl));
    }
    y += 8;
  }

  heading("Rule Compliance Score");
  statLine("Compliance", `${Math.round(compliancePct)}%`);
  statLine("Clean Trades", cleanTrades);
  statLine("Rule Violations", report.rule_violations);
  y += 8;

  heading("Performance Statistics");
  const pfDisplay =
    performanceStats.profitFactor === Infinity
      ? "∞"
      : `${performanceStats.profitFactor.toFixed(1)}x`;
  statLine("Profit Factor", pfDisplay);
  statLine("Expectancy", `${formatCurrency(performanceStats.expectancy)} / trade`);
  statLine("Avg Winning Trade", formatCurrency(performanceStats.avgWin));
  statLine("Avg Losing Trade", formatCurrency(performanceStats.avgLoss));
  statLine("Largest Win", formatCurrency(performanceStats.largestWin));
  statLine("Largest Loss", formatCurrency(performanceStats.largestLoss));
  statLine(
    "Max Drawdown",
    `${formatCurrency(performanceStats.maxDrawdown)} (${performanceStats.maxDrawdownPct.toFixed(1)}%)`
  );
  statLine("Consecutive Wins Record", performanceStats.maxWinStreak);
  statLine("Consecutive Losses Record", performanceStats.maxLossStreak);
  statLine("Average R", formatRMultiple(performanceStats.avgR));
  statLine("Total R", formatRMultiple(performanceStats.totalR));
  statLine("Best R Trade", formatRMultiple(performanceStats.bestR));
  statLine("Worst R Trade", formatRMultiple(performanceStats.worstR));
  y += 8;

  heading("Day of Week Analysis");
  dayOfWeek.rows.forEach((row) => {
    if (!row.hasData) {
      statLine(row.day, "—");
    } else {
      statLine(
        row.day,
        `${row.trades} trades · ${row.winRate.toFixed(0)}% win · ${formatCurrency(
          row.netPnl
        )} · ${formatRMultiple(row.avgR)}`
      );
    }
  });
  statLine("Best Day", dayOfWeek.bestDay ? dayOfWeek.bestDay.day : "—");
  statLine("Worst Day", dayOfWeek.worstDay ? dayOfWeek.worstDay.day : "—");
  y += 8;

  heading("Mistake Breakdown");
  if (mistakeBreakdown.length === 0) {
    paragraph(`No mistakes recorded ${periodText}.`);
  } else {
    mistakeBreakdown.forEach((m) => {
      statLine(m.name, `${m.count}x  ·  ${formatCurrency(m.cost)}`);
    });
  }
  y += 8;

  heading("Best Day vs Worst Day");
  statLine("Best Day", bestDay ? `${toDDMMYYYY(bestDay.date)}  —  ${formatCurrency(bestDay.pnl)}` : "—");
  statLine("Worst Day", worstDay ? `${toDDMMYYYY(worstDay.date)}  —  ${formatCurrency(worstDay.pnl)}` : "—");
  y += 8;

  heading("Disciplined vs Impulsive");
  statLine(`Clean Trades Avg (${disciplined.cleanCount})`, formatCurrency(disciplined.cleanAvg));
  statLine(`Rule-Broken Avg (${disciplined.violatedCount})`, formatCurrency(disciplined.violatedAvg));
  statLine("Difference", formatCurrency(disciplined.difference));
  y += 8;

  divider();

  heading("Top 3 Strengths");
  parseListItems(sections["TOP 3 STRENGTHS"]).forEach((s) => paragraph(`•  ${s}`));
  y += 4;

  heading("Top 3 Weaknesses");
  parseListItems(sections["TOP 3 WEAKNESSES"]).forEach((w) => paragraph(`•  ${w}`));
  y += 4;

  const goalsTitle =
    reportType === "monthly"
      ? "3 Goals for Next Month"
      : reportType === "overall"
      ? "3 Goals for Ongoing Development"
      : "3 Goals for Next Week";
  heading(goalsTitle);
  parseListItems(sections[goalsHeader]).forEach((g, i) => paragraph(`${i + 1}.  ${g}`));

  const fileSuffix =
    reportType === "monthly"
      ? (report.month_year || "monthly").replace(/\s+/g, "-")
      : reportType === "overall"
      ? "all-time"
      : `${report.week_start}-to-${report.week_end}`;
  doc.save(`TradeLog-Report-${fileSuffix}.pdf`);
}
