import { NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL, stripJsonFences } from "@/lib/anthropic";
import {
  supabase,
  TRADES_TABLE,
  REPORTS_TABLE,
  CHARGES_TABLE,
  EXPENSES_TABLE,
  CAPITAL_TABLE,
} from "@/lib/supabase";
import { toDDMMYYYY, getMonthRange } from "@/lib/utils";
import { computeNetPnlByDate, computeCapitalMetrics } from "@/lib/capitalStats";

export const runtime = "nodejs";

const GOALS_HEADER = {
  weekly: "3 GOALS FOR NEXT WEEK",
  monthly: "3 GOALS FOR NEXT MONTH",
  overall: "3 GOALS FOR ONGOING DEVELOPMENT",
};

const ECONOMIC_PROMPT_NOTE =
  " Comment briefly on whether the trading operation is economically profitable after operating costs, and whether the current expense level is sustainable relative to trading performance. Keep this to 1-2 sentences and fold it into the TOP 3 WEAKNESSES section as context for one of the points, or into the goals section as context for one goal — do not create a separate standalone section for it, and do not let it run past 2 sentences.";

function buildReportTypeNote(reportType, monthYear) {
  if (reportType === "monthly") {
    return `This is a monthly performance report for ${monthYear}. Look for monthly patterns, consistency trends, and give 3 goals for next month.${ECONOMIC_PROMPT_NOTE}`;
  }
  if (reportType === "overall") {
    return `This is an all-time performance report covering all trades since the first logged trade. Identify long-term trajectory, whether discipline is improving or declining over time, and give 3 strategic goals for ongoing development.${ECONOMIC_PROMPT_NOTE}`;
  }
  return "Focus on this week's specific patterns and give 3 goals for next week.";
}

async function buildEconomicText(reportType, monthYear, netPnl) {
  if (reportType === "weekly") return "";

  let expenseRows = [];
  if (reportType === "monthly") {
    const { data } = await supabase
      .from(EXPENSES_TABLE)
      .select("*")
      .eq("month_year", monthYear)
      .maybeSingle();
    expenseRows = data ? [data] : [];
  } else if (reportType === "overall") {
    const { data } = await supabase.from(EXPENSES_TABLE).select("*");
    expenseRows = data || [];
  }

  if (expenseRows.length === 0) return "";

  const totalExpenses = expenseRows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

  let breakdownLines;
  if (reportType === "monthly") {
    const breakdown = Array.isArray(expenseRows[0].breakdown) ? expenseRows[0].breakdown : [];
    breakdownLines = breakdown
      .map((item) => `${item.category}: ₹${Number(item.amount || 0).toFixed(2)}`)
      .join("\n");
  } else {
    breakdownLines = expenseRows
      .slice()
      .sort((a, b) => {
        const rangeA = getMonthRange(a.month_year);
        const rangeB = getMonthRange(b.month_year);
        if (!rangeA || !rangeB) return 0;
        return rangeA.start.localeCompare(rangeB.start);
      })
      .map((r) => `${r.month_year}: ₹${Number(r.total_amount || 0).toFixed(2)}`)
      .join("\n");
  }

  const economicPnl = netPnl - totalExpenses;
  const label = economicPnl > 0 ? "profitable" : "loss";

  return `Operating Expenses for ${reportType === "monthly" ? monthYear : "all tracked months"}:
${breakdownLines}
Total Operating Expenses: ₹${totalExpenses.toFixed(2)}

Economic Summary:
Net Trading P&L: ₹${netPnl.toFixed(2)}
Operating Expenses: ₹${totalExpenses.toFixed(2)}
Economic P&L: ₹${economicPnl.toFixed(2)} (${label})

Note: Operating expenses are paid from personal income and do not reduce trading capital.
Economic P&L shows whether trading is covering its own operational costs.`;
}

async function buildCapitalText(reportType, trades, dailyCharges) {
  if (reportType !== "overall") return "";

  const { data } = await supabase.from(CAPITAL_TABLE).select("*");
  const transactions = data || [];
  if (!transactions.some((t) => t.type === "initial_capital")) return "";

  const netPnlByDate = computeNetPnlByDate(trades, dailyCharges);
  const metrics = computeCapitalMetrics(transactions, netPnlByDate);

  return `Capital Summary:
Starting Capital: ₹${metrics.startingCapital.toFixed(2)}
Total Deposited: ₹${metrics.totalDeposited.toFixed(2)}
Total Withdrawn: ₹${metrics.totalWithdrawn.toFixed(2)}
Total Trading P&L: ₹${metrics.totalTradingPnl.toFixed(2)}
Current Account Value: ₹${metrics.currentValue.toFixed(2)}
Trading Return: ${metrics.tradingReturn.toFixed(1)}% (trading P&L as a percentage of capital invested — not affected by withdrawals)
Account Growth: ${metrics.accountGrowth.toFixed(1)}% (actual account size change since starting capital, including deposits and withdrawals)
Peak Capital: ₹${metrics.peakCapital.toFixed(2)}
Max Drawdown from Peak: ₹${metrics.drawdownAmount.toFixed(2)} (${metrics.drawdownPercent.toFixed(1)}%)

Note: Trading Return measures pure trading performance. Account Growth reflects the account's actual size change and will differ from Trading Return whenever the trader has deposited or withdrawn capital — a withdrawal is a capital movement, not a trading loss, so do not describe withdrawals as hurting performance. Comment on whether the trader is building long-term wealth, whether withdrawals are sustainable relative to trading performance, and the trajectory of account growth. Keep this to 1-2 sentences and fold it into the TOP 3 WEAKNESSES section as context for one of the points, or into the goals section as context for one goal — do not create a separate standalone section for it, and do not let it run past 2 sentences.`;
}

function buildPrompt(
  trades,
  chargesText,
  statsText,
  economicText,
  capitalText,
  reportTypeNote,
  goalsHeader
) {
  return `You are an AI trading coach generating a performance report for Umesh, an intraday equity trader.

His rulebook:
1. No overtrading (max 2-3 trades/day)
2. No FOMO entries
3. Stop trading once daily limit is hit
4. No emotional trades

${reportTypeNote}

All trades in this period:
${JSON.stringify(trades)}

${chargesText}

${statsText}

${economicText}

${capitalText}

For each trade, the specific rules broken are listed in rules_broken_detail. Use this to identify which specific rules Umesh breaks most frequently and call them out by name in the TOP 3 WEAKNESSES and ${goalsHeader} sections.

Generate a detailed performance report with these exact sections. Use clear section headers exactly as written:

PERFORMANCE SUMMARY
Total trades, win rate, total Overall P&L, total Net P&L (after govt charges and brokerage), profitable trades count, loss trades count, average P&L per trade.

RULE COMPLIANCE SCORE
Percentage of trades with no rule violations. Number of clean trades vs violated trades.

MISTAKE BREAKDOWN
For each mistake type that occurred in this period: name, how many times, estimated ₹ cost impact.

BEST DAY AND WORST DAY
Which day had the best P&L and why. Which day had the worst and why.

DISCIPLINED VS IMPULSIVE
Average P&L of clean trades vs rule-broken trades. What the difference costs over time.

TOP 3 STRENGTHS
What Umesh did well in this period. Be specific.

TOP 3 WEAKNESSES
What Umesh must fix. Be specific and direct.

${goalsHeader}
Specific, measurable, actionable. Not generic advice.

Be brutally honest. No motivational language. Call out repeated mistakes directly. Use ₹ for all monetary values.

Write in plain text only — no markdown formatting (no **, ##, backticks, or horizontal rules like ---). Under TOP 3 STRENGTHS, TOP 3 WEAKNESSES, and ${goalsHeader}, write each point as a single numbered line (e.g. "1. ...") with no line breaks inside a point.`;
}

function buildChargesText(trades, dailyCharges) {
  const chargesByDate = {};
  dailyCharges.forEach((c) => {
    chargesByDate[c.date] = c;
  });

  const overallByDay = {};
  trades.forEach((t) => {
    overallByDay[t.date] = (overallByDay[t.date] || 0) + (Number(t.overall_pnl) || 0);
  });

  const tradingDates = Object.keys(overallByDay).sort();
  const withoutCharges = tradingDates.filter((d) => !chargesByDate[d]);

  const lines = tradingDates.map((d) => {
    const c = chargesByDate[d];
    if (!c) return `${toDDMMYYYY(d)}: no charges entered`;
    return `${toDDMMYYYY(d)}: Overall P&L: ₹${overallByDay[d].toFixed(2)}, Govt Charges: ₹${Number(c.govt_charges || 0).toFixed(2)}, Brokerage: ₹${Number(c.brokerage || 0).toFixed(2)}, Net P&L: ₹${Number(c.net_pnl || 0).toFixed(2)}`;
  });

  const totalOverallPnl = tradingDates.reduce((sum, d) => sum + overallByDay[d], 0);
  const totalGovtCharges = dailyCharges.reduce((sum, c) => sum + (Number(c.govt_charges) || 0), 0);
  const totalBrokerage = dailyCharges.reduce((sum, c) => sum + (Number(c.brokerage) || 0), 0);
  const totalCharges = totalGovtCharges + totalBrokerage;
  let totalNetPnl = 0;
  tradingDates.forEach((d) => {
    totalNetPnl += chargesByDate[d] ? Number(chargesByDate[d].net_pnl) || 0 : overallByDay[d];
  });

  return `Financial summary for this period:
${lines.join("\n")}
Total Overall P&L: ₹${totalOverallPnl.toFixed(2)}
Total Charges Paid: ₹${totalCharges.toFixed(2)} (govt: ₹${totalGovtCharges.toFixed(2)} + brokerage: ₹${totalBrokerage.toFixed(2)})
Total Net P&L: ₹${totalNetPnl.toFixed(2)}
Days without charges entered: ${withoutCharges.length > 0 ? withoutCharges.map(toDDMMYYYY).join(", ") : "None"}`;
}

function buildCalculatedStatsText(stats) {
  if (!stats) return "";
  const pf =
    stats.profitFactor === "Infinity" || stats.profitFactor === Infinity
      ? "∞"
      : `${Number(stats.profitFactor || 0).toFixed(1)}x`;

  const dayLines = (stats.dayOfWeek || [])
    .map((d) => {
      if (!d) return "";
      if (!d.trades) return `${d.day}: no trades`;
      const avgR = d.avgR != null ? Number(d.avgR).toFixed(2) : "—";
      return `${d.day}: ${d.trades} trades, ${Number(d.winRate || 0).toFixed(0)}% win rate, ₹${Number(
        d.netPnl || 0
      ).toFixed(2)} P&L, ${avgR} avg R`;
    })
    .filter(Boolean)
    .join("\n");

  return `Calculated Statistics for this period:
Profit Factor: ${pf}
Expectancy: ₹${Number(stats.expectancy || 0).toFixed(2)} per trade
Average R: ${stats.avgR != null ? Number(stats.avgR).toFixed(2) : "—"}
Total R: ${stats.totalR != null ? Number(stats.totalR).toFixed(2) : "—"}
Max Drawdown: ₹${Number(stats.maxDrawdown || 0).toFixed(2)} (${Number(stats.maxDrawdownPct || 0).toFixed(1)}%)
Largest Win: ₹${Number(stats.largestWin || 0).toFixed(2)}
Largest Loss: ₹${Number(stats.largestLoss || 0).toFixed(2)}
Consecutive Wins Record: ${stats.maxWinStreak ?? 0}
Consecutive Losses Record: ${stats.maxLossStreak ?? 0}

Day of Week Performance:
${dayLines}
Best Day: ${stats.bestDay?.day || "—"}
Worst Day: ${stats.worstDay?.day || "—"}`;
}

function computeStats(trades, dailyCharges) {
  const total_trades = trades.length;
  const profitable_trades = trades.filter((t) => Number(t.overall_pnl) > 0).length;
  const loss_trades = trades.filter((t) => Number(t.overall_pnl) < 0).length;
  const win_rate = total_trades > 0 ? Math.round((profitable_trades / total_trades) * 10000) / 100 : 0;
  const rule_violations = trades.filter((t) => t.rule_broken).length;

  const mistakeCounts = {};
  trades.forEach((t) => {
    (t.mistake_types || []).forEach((raw) => {
      const m = String(raw || "").trim().toLowerCase();
      if (!m || m === "clean trade") return;
      mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
    });
  });
  const top_mistakes = Object.entries(mistakeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // charges-aware net P&L: for days with charges entered use the saved net_pnl,
  // otherwise fall back to that day's raw overall_pnl sum
  const chargesByDate = {};
  dailyCharges.forEach((c) => {
    chargesByDate[c.date] = c;
  });
  const overallByDay = {};
  trades.forEach((t) => {
    overallByDay[t.date] = (overallByDay[t.date] || 0) + (Number(t.overall_pnl) || 0);
  });
  let net_pnl = 0;
  Object.keys(overallByDay).forEach((date) => {
    net_pnl += chargesByDate[date] ? Number(chargesByDate[date].net_pnl) || 0 : overallByDay[date];
  });

  return {
    total_trades,
    profitable_trades,
    loss_trades,
    net_pnl: Math.round(net_pnl * 100) / 100,
    win_rate,
    rule_violations,
    top_mistakes,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      week_start,
      week_end,
      report_type: reportTypeRaw,
      month_year,
      calculated_stats,
    } = body;

    const report_type = ["weekly", "monthly", "overall"].includes(reportTypeRaw)
      ? reportTypeRaw
      : "weekly";

    let rangeStart = null;
    let rangeEnd = null;

    if (report_type === "weekly") {
      if (!week_start || !week_end) {
        return NextResponse.json(
          { error: "week_start and week_end are required" },
          { status: 400 }
        );
      }
      rangeStart = week_start;
      rangeEnd = week_end;
    } else if (report_type === "monthly") {
      if (!month_year) {
        return NextResponse.json({ error: "month_year is required" }, { status: 400 });
      }
      const range = getMonthRange(month_year);
      if (!range) {
        return NextResponse.json({ error: "Invalid month_year" }, { status: 400 });
      }
      rangeStart = range.start;
      rangeEnd = range.end;
    }
    // overall: rangeStart/rangeEnd stay null — no date filter

    let tradesQuery = supabase.from(TRADES_TABLE).select("*").order("date", { ascending: true });
    if (rangeStart) tradesQuery = tradesQuery.gte("date", rangeStart);
    if (rangeEnd) tradesQuery = tradesQuery.lte("date", rangeEnd);
    const { data: trades, error: fetchError } = await tradesQuery;

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!trades || trades.length === 0) {
      const emptyMessage =
        report_type === "monthly"
          ? "No trades logged for this month"
          : report_type === "overall"
          ? "No trades logged yet"
          : "No trades logged for this week";
      return NextResponse.json({ error: emptyMessage }, { status: 404 });
    }

    let chargesQuery = supabase.from(CHARGES_TABLE).select("*");
    if (rangeStart) chargesQuery = chargesQuery.gte("date", rangeStart);
    if (rangeEnd) chargesQuery = chargesQuery.lte("date", rangeEnd);
    const { data: dailyChargesRaw, error: chargesError } = await chargesQuery;

    if (chargesError) {
      throw new Error(chargesError.message);
    }

    const dailyCharges = dailyChargesRaw || [];
    const stats = computeStats(trades, dailyCharges);

    const anthropic = getAnthropicClient();
    const chargesText = buildChargesText(trades, dailyCharges);
    const statsText = buildCalculatedStatsText(calculated_stats);
    const economicText = await buildEconomicText(report_type, month_year, stats.net_pnl);
    const capitalText = await buildCapitalText(report_type, trades, dailyCharges);
    const reportTypeNote = buildReportTypeNote(report_type, month_year);
    const goalsHeader = GOALS_HEADER[report_type] || GOALS_HEADER.weekly;
    const prompt = buildPrompt(
      trades,
      chargesText,
      statsText,
      economicText,
      capitalText,
      reportTypeNote,
      goalsHeader
    );

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3072,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "AI did not return a readable response." },
        { status: 502 }
      );
    }

    const report_content = stripJsonFences(textBlock.text);

    const record = {
      week_start: rangeStart || trades[0].date,
      week_end: rangeEnd || trades[trades.length - 1].date,
      report_content,
      ...stats,
      report_type,
      month_year: report_type === "monthly" ? month_year : null,
      generated_at: new Date().toISOString(),
    };

    let existingQuery = supabase.from(REPORTS_TABLE).select("id").eq("report_type", report_type);
    if (report_type === "weekly") existingQuery = existingQuery.eq("week_start", week_start);
    if (report_type === "monthly") existingQuery = existingQuery.eq("month_year", month_year);
    const { data: existing } = await existingQuery.maybeSingle();

    let savedReport, insertError;
    if (existing) {
      ({ data: savedReport, error: insertError } = await supabase
        .from(REPORTS_TABLE)
        .update(record)
        .eq("id", existing.id)
        .select()
        .single());
    } else {
      ({ data: savedReport, error: insertError } = await supabase
        .from(REPORTS_TABLE)
        .insert(record)
        .select()
        .single());
    }

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, report: savedReport });
  } catch (err) {
    console.error("generate-report error:", {
      message: err?.message,
      name: err?.name,
      status: err?.status,
      stack: err?.stack,
      response: err?.error ?? err?.response?.data,
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
