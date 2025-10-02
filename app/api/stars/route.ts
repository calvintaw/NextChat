import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { starsBackgroundEnabled } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("starsBackgroundEnabled", starsBackgroundEnabled, { path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
