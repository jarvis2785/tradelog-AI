import { NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL, stripJsonFences } from "@/lib/anthropic";
import { supabase, TRADES_TABLE, REPORTS_TABLE } from "@/lib/supabase";

function buildPrompt(trades) {
  return `You are an AI trading coach generating a weekly performance report for Umesh, an intraday equity trader.

His rulebook:
1. No overtrading (max 2-3 trades/day)
2. No FOMO entries
3. Stop trading once daily limit is hit
4. No emotional trades

All trades this week:
${JSON.stringify(trades)}

Generate a detailed weekly performance report with these exact sections. Use clear section headers exactly as written:

PERFORMANCE SUMMARY
Total trades, win rate, net P&L, profitable trades count, loss trades count, average P&L per trade.

RULE COMPLIANCE SCORE
Percentage of trades with no rule violations. Number of clean trades vs violated trades.

MISTAKE BREAKDOWN
For each mistake type that occurred this week: name, how many times, estimated ₹ cost impact.

BEST DAY AND WORST DAY
Which day had the best P&L and why. Which day had the worst and why.

DISCIPLINED VS IMPULSIVE
Average P&L of clean trades vs rule-broken trades. What the difference costs over time.

TOP 3 STRENGTHS
What Umesh did well this week. Be specific.

TOP 3 WEAKNESSES
What Umesh must fix. Be specific and direct.

3 GOALS FOR NEXT WEEK
Specific, measurable, actionable. Not generic advice.

Be brutally honest. No motivational language. Call out repeated mistakes directly. Use ₹ for all monetary values.

Write in plain text only — no markdown formatting (no **, ##, backticks, or horizontal rules like ---). Under TOP 3 STRENGTHS, TOP 3 WEAKNESSES, and 3 GOALS FOR NEXT WEEK, write each point as a single numbered line (e.g. "1. ...") with no line breaks inside a point.`;
}

function computeStats(trades) {
  const total_trades = trades.length;
  const profitable_trades = trades.filter((t) => Number(t.net_pnl) > 0).length;
  const loss_trades = trades.filter((t) => Number(t.net_pnl) < 0).length;
  const net_pnl = trades.reduce((sum, t) => sum + (Number(t.net_pnl) || 0), 0);
  const win_rate = total_trades > 0 ? Math.round((profitable_trades / total_trades) * 10000) / 100 : 0;
  const rule_violations = trades.filter((t) => t.rule_broken).length;

  const mistakeCounts = {};
  trades.forEach((t) => {
    (t.mistake_types || []).forEach((m) => {
      if (!m || m.toLowerCase() === "clean trade") return;
      mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
    });
  });
  const top_mistakes = Object.entries(mistakeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

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
    const { week_start, week_end } = await request.json();

    if (!week_start || !week_end) {
      return NextResponse.json(
        { error: "week_start and week_end are required" },
        { status: 400 }
      );
    }

    const { data: trades, error: fetchError } = await supabase
      .from(TRADES_TABLE)
      .select("*")
      .gte("date", week_start)
      .lte("date", week_end)
      .order("date", { ascending: true });

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json(
        { error: "No trades logged for this week" },
        { status: 404 }
      );
    }

    const anthropic = getAnthropicClient();
    const prompt = buildPrompt(trades);

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
    const stats = computeStats(trades);

    const record = {
      week_start,
      week_end,
      report_content,
      ...stats,
      generated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from(REPORTS_TABLE)
      .select("id")
      .eq("week_start", week_start)
      .maybeSingle();

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
    console.error("generate-report error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
