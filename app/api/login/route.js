import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const correctPassword = process.env.LOGIN_PASSWORD;

    if (password !== correctPassword) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
