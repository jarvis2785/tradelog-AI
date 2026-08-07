import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAnthropicClient, CLAUDE_MODEL, parseClaudeJson } from "@/lib/anthropic";
import { supabase, TRADES_TABLE, SCREENSHOTS_BUCKET } from "@/lib/supabase";

function buildPrompt(description, trade, rulesBrokenDetail) {
  const brokenRulesLine =
    rulesBrokenDetail && rulesBrokenDetail.length > 0
      ? rulesBrokenDetail.join(", ")
      : "None — trying to follow all rules";

  return `You are an AI trading coach for an intraday equity trader named Umesh.

His personal rulebook:
1. No overtrading — maximum 2 to 3 trades per day
2. No FOMO entries — never enter mid-move without a confirmed setup
3. Once daily risk or trade limit is hit, stop trading immediately
4. No emotional trades — all decisions must follow the plan

Mistake categories:
- FOMO entry: entered without proper setup or mid-move out of fear of missing out
- Early exit: closed a winning trade too soon out of fear
- Late entry: entered a valid setup but too late into the move
- Overtrading: took more trades than the daily limit
- Emotional trade: decision based on fear or greed not the plan
- Moved stop loss: changed stop loss after entry to avoid or reduce a loss
- No setup: entered with no clear strategy or confirmation
- Revenge trade: traded specifically to recover a previous loss
- Clean trade: followed all rules perfectly

Analyse this journal entry: "${description}"

Trade details: ${JSON.stringify(trade)}

Rules the trader was NOT trying to follow for this trade: ${brokenRulesLine}
Use this list to make your ai_analysis specific to these exact rule violations rather than guessing.

Return ONLY valid JSON. No explanation. No markdown. No code blocks.

{"mistake_types":["applicable mistakes or clean trade"],"rule_broken":true or false,"ai_analysis":"2-3 sentences. Brutally honest assessment. What went right, what went wrong, what to watch. No motivation, no sugarcoating."}`;
}

function calculateRR(trade) {
  const buy = Number(trade.buy_avg_price);
  const target = Number(trade.target_price);
  const sl = Number(trade.stop_loss_price);
  if (!trade.target_price || !trade.stop_loss_price || !buy || buy - sl === 0) {
    return null;
  }
  const rr = (target - buy) / (buy - sl);
  return Math.round(rr * 100) / 100;
}

async function uploadScreenshot(screenshot) {
  const { base64, mimeType } = screenshot;
  const ext = mimeType.split("/")[1] || "jpg";
  const path = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(base64, "base64");

  const { error: uploadError } = await supabase.storage
    .from(SCREENSHOTS_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from(SCREENSHOTS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { trade, description, screenshot, screenshot_url, rules_broken_detail } = body;

    if (!trade || !description) {
      return NextResponse.json(
        { error: "Trade and description are required" },
        { status: 400 }
      );
    }

    const riskRewardRatio = calculateRR(trade);
    const rulesBrokenDetail = Array.isArray(rules_broken_detail) ? rules_broken_detail : [];

    const anthropic = getAnthropicClient();
    const prompt = buildPrompt(
      description,
      { ...trade, risk_reward_ratio: riskRewardRatio },
      rulesBrokenDetail
    );

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "AI did not return a readable response." },
        { status: 502 }
      );
    }

    let analysis;
    try {
      analysis = parseClaudeJson(textBlock.text);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Could not analyse this trade. Please try again." },
        { status: 422 }
      );
    }

    let finalScreenshotUrl = screenshot_url || null;
    if (!finalScreenshotUrl && screenshot?.base64 && screenshot?.mimeType) {
      finalScreenshotUrl = await uploadScreenshot(screenshot);
    }

    const overallPnl = trade.overall_pnl === "" || trade.overall_pnl == null ? null : Number(trade.overall_pnl);

    const record = {
      date: trade.date,
      stock_name: trade.stock_name,
      exchange: trade.exchange,
      product_type: trade.product_type || "Intraday",
      quantity: trade.quantity === "" || trade.quantity == null ? null : Number(trade.quantity),
      buy_avg_price: trade.buy_avg_price === "" || trade.buy_avg_price == null ? null : Number(trade.buy_avg_price),
      sell_avg_price: trade.sell_avg_price === "" || trade.sell_avg_price == null ? null : Number(trade.sell_avg_price),
      ltp: trade.ltp === "" || trade.ltp == null ? null : Number(trade.ltp),
      overall_pnl: overallPnl,
      net_pnl: overallPnl,
      screenshot_url: finalScreenshotUrl,
      description,
      mistake_types: (analysis.mistake_types || []).map((m) => String(m).trim().toLowerCase()),
      rule_broken: !!analysis.rule_broken,
      rules_broken_detail: rulesBrokenDetail,
      ai_analysis: analysis.ai_analysis || "",
      entry_time: trade.entry_time || null,
      exit_time: trade.exit_time || null,
      target_price: trade.target_price === "" || trade.target_price == null ? null : Number(trade.target_price),
      risk_reward_ratio: riskRewardRatio,
    };

    const { data: savedTrade, error: insertError } = await supabase
      .from(TRADES_TABLE)
      .insert(record)
      .select()
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ success: true, trade: savedTrade });
  } catch (err) {
    console.error("analyse-trade error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
