import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const freeRoutes = ["/login", "/register", "/terms_and_services"];

const isProd = process.env.NODE_ENV === "production";

export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";

	// console.log("Middleware triggered for path:", pathname);
	// console.log("Environment:", isProd ? "production" : "development");
	// console.log("Using cookie name:", cookieName);

	// Check authentication
	const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET, raw: true, cookieName });
	const isAuthenticated = !!token;

	// console.log("Token found:", !!token);
	// console.log("Authenticated:", isAuthenticated);

	// Normalize pathname to avoid trailing slash issues
	const normalizedPathname = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	// console.log("Normalized pathname:", normalizedPathname);

	const isFreeRoute = freeRoutes.includes(normalizedPathname);
	// console.log("Is free route:", isFreeRoute);

	let response: NextResponse;

	// Case 1: Unauthenticated user on a protected route
	if (!isFreeRoute && !isAuthenticated) {
		// console.log("Redirecting unauthenticated user to /login");
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Case 2: Authenticated user on a free route
	// if (isFreeRoute && isAuthenticated) {
	// 	// console.log("Redirecting authenticated user from free route to /dashboard");
	// 	return NextResponse.redirect(new URL("/dashboard", request.url));
	// }

	// Case 3: All other cases
	response = NextResponse.next();
	// console.log("Proceeding to next middleware or route handler");

	// Set default theme cookie if missing
	if (!request.cookies.has("theme")) {
		response.cookies.set("theme", "dark", {
			path: "/",
			maxAge: 60 * 60 * 24 * 30, // 30 days
		});
	}
	// } else {
	// console.log("Theme cookie exists:", request.cookies.get("theme")?.value);
	// }

	return response;
}

export const config = {
	matcher: ["/((?!api/auth|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)"],
};
