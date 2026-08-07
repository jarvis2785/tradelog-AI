import { NextResponse } from "next/server";
import { getAnthropicClient, CLAUDE_MODEL, parseClaudeJson } from "@/lib/anthropic";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Browsers/OSes sometimes report the wrong File.type (e.g. iOS HEIC->JPEG
// conversions still labelled image/png). Claude Vision rejects a media_type
// that doesn't match the actual bytes, so sniff the real format from the
// image's magic bytes and trust that over the client-supplied mimeType.
function detectMimeTypeFromBase64(base64) {
  try {
    const buffer = Buffer.from(base64.slice(0, 64), "base64");
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    ) {
      return "image/png";
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
    if (
      buffer.length >= 6 &&
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    ) {
      return "image/gif";
    }
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return "image/webp";
    }
  } catch {
    return null;
  }
  return null;
}

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
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("extract-trade error: ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { image, mimeType: clientMimeType } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const detectedMimeType = detectMimeTypeFromBase64(image);
    const candidateMimeType = detectedMimeType || clientMimeType;
    const mimeType = ALLOWED_MIME_TYPES.includes(candidateMimeType)
      ? candidateMimeType
      : "image/jpeg";

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
    console.error("extract-trade error:", {
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
