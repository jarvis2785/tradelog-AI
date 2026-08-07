import { NextResponse } from "next/server";
import { supabase, TRADES_TABLE, SCREENSHOTS_BUCKET } from "@/lib/supabase";

export const runtime = "nodejs";

function extractStoragePath(screenshotUrl) {
  try {
    const url = new URL(screenshotUrl);
    const marker = `/${SCREENSHOTS_BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return null;
    return url.pathname.slice(idx + marker.length);
  } catch {
    return null;
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { id, screenshot_url } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    if (screenshot_url) {
      const path = extractStoragePath(screenshot_url);
      if (path) {
        await supabase.storage.from(SCREENSHOTS_BUCKET).remove([path]);
      }
    }

    const { error: deleteError } = await supabase
      .from(TRADES_TABLE)
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("delete-trade error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
