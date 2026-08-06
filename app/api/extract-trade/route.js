import { NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL, parseClaudeJson } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are a trading journal assistant. The user has shared a screenshot from the Groww broker app showing their intraday positions for the day.

Extract ALL trades visible in this screenshot. There may be one or multiple trades.

For each trade extract:
- stock_name: full stock name as shown
- exchange: NSE or BSE
- product_type: Intraday
- quantity: the Qty value as a number
- buy_avg_price: Buy Avg Price as a number
- sell_avg_price: Sell Avg Price as a number
- ltp: LTP value as a number
- gross_pnl: P&L value as a number — negative if shown in red or with minus sign
- entry_time: only if visible else null
- exit_time: only if visible else null

Return ONLY a valid JSON array. No explanation. No markdown. No code blocks. Just the raw JSON array.

Example: [{"stock_name":"NALCO","exchange":"NSE","product_type":"Intraday","quantity":100,"buy_avg_price":375.20,"sell_avg_price":380.45,"ltp":374.75,"gross_pnl":525.00,"entry_time":null,"exit_time":null}]

If any field not visible return null for that field.`;

export async function POST(request) {
  try {
    const { image, mimeType } = await request.json();

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: "Image and mimeType are required" },
        { status: 400 }
      );
    }

    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: image,
              },
            },
            {
              type: "text",
              text: "Extract all trades from this screenshot and return the JSON array.",
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "AI did not return a readable response." },
        { status: 502 }
      );
    }

    let trades;
    try {
      trades = parseClaudeJson(textBlock.text);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Could not read trade data from screenshot. Please enter details manually." },
        { status: 422 }
      );
    }

    if (!Array.isArray(trades)) {
      trades = [trades];
    }

    return NextResponse.json({ trades });
  } catch (err) {
    console.error("extract-trade error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
