import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const { theme } = await req.json();
	const res = NextResponse.json({ ok: true });
	res.cookies.set("theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 30 });
	return res;
}
