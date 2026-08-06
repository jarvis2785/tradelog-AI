import jsPDF from "jspdf";
import { formatCurrency, toDDMMYYYY } from "./utils";
import { parseReportSections, parseListItems } from "./reportParser";
import {
  computeBestWorstTrade,
  computeBestWorstDay,
  computeDisciplinedVsImpulsive,
  computeMistakeBreakdown,
} from "./reportStats";

const MARGIN = 44;
const PAGE_WIDTH = 595.28; // A4 pt
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function generateReportPdf(report, trades) {
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

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text("TradeLog AI — Weekly Report", MARGIN, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(90, 90, 90);
  doc.text(`${toDDMMYYYY(report.week_start)} — ${toDDMMYYYY(report.week_end)}`, MARGIN, y);
  y += 26;

  divider();

  const sections = parseReportSections(report.report_content);
  const { best, worst } = computeBestWorstTrade(trades);
  const { bestDay, worstDay } = computeBestWorstDay(trades);
  const disciplined = computeDisciplinedVsImpulsive(trades);
  const mistakeBreakdown = computeMistakeBreakdown(trades);
  const cleanTrades = report.total_trades - report.rule_violations;
  const compliancePct = report.total_trades > 0 ? (cleanTrades / report.total_trades) * 100 : 0;

  heading("Performance Summary");
  statLine("Total Trades", report.total_trades);
  statLine("Win Rate", `${report.win_rate.toFixed(1)}%`);
  statLine("Net P&L", formatCurrency(report.net_pnl));
  statLine("Best Trade", best ? formatCurrency(best.net_pnl) : "—");
  statLine("Worst Trade", worst ? formatCurrency(worst.net_pnl) : "—");
  y += 8;

  heading("Rule Compliance Score");
  statLine("Compliance", `${Math.round(compliancePct)}%`);
  statLine("Clean Trades", cleanTrades);
  statLine("Rule Violations", report.rule_violations);
  y += 8;

  heading("Mistake Breakdown");
  if (mistakeBreakdown.length === 0) {
    paragraph("No mistakes recorded this week.");
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

  heading("3 Goals for Next Week");
  parseListItems(sections["3 GOALS FOR NEXT WEEK"]).forEach((g, i) => paragraph(`${i + 1}.  ${g}`));

  doc.save(`TradeLog-Report-${report.week_start}-to-${report.week_end}.pdf`);
}
