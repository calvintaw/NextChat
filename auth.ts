import NextAuth, { Session, User } from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { LoginFormSchema, sql } from "./app/lib/definitions";
import { JWT } from "next-auth/jwt";
import path from "path";

type DBUser = {
	id: string;
	image: string;
	username: string;
	displayName: string;
	email: string;
	createdAt: string;
	password: string;
};

type AuthUser = Omit<DBUser, "password">;
const isProd = process.env.NODE_ENV === "production";

async function getUser(email: string | null, username: string|null): Promise<DBUser | undefined> {
	try {
		if (!email?.trim() && !username?.trim()) {
			console.warn("getUser: No email or username provided");
			return undefined;
		}

		const users = await sql<DBUser[]>`
			select 
				id, 
				password, 
				email, 
				username, 
				display_name as "displayName", 
				created_at as "createdAt",
				image
			from users
			where 
				(${email ? sql`email = ${email}` : sql`false`})
				or 
				(${username ? sql`username = ${username}` : sql`false`})
			limit 1
		`;

		return users[0];
	} catch (error) {
		console.error("Failed to fetch user:", error);
		throw new Error("Failed to fetch user.");
	}
}

export const config = {
	providers: [
		GitHub({
			clientId: process.env.AUTH_GITHUB_ID!,
			clientSecret: process.env.AUTH_GITHUB_SECRET!,
		}),
		Credentials({
			async authorize(credentials, request) {
if (credentials.email === "null") credentials.email = null;
if (credentials.username === "null") credentials.username = null;

				console.log("Credentials received:", credentials);

				const parsed = LoginFormSchema.safeParse(credentials);
				if (!parsed.success) {
					console.log("Validation failed:", parsed.error.format());
					return null;
				}

				const { username, email, password } = parsed.data;
				const user = await getUser(email, username);

				if (!user) {
					console.log("User not found");
					return null;
				}

				const passwordsMatch = await bcrypt.compare(password, user.password);
				if (!passwordsMatch) {
					console.log("Password does not match");
					return null;
				}

				console.log("User authenticated:", user);
				return {
					id: user.id,
					username: user.username,
					displayName: user.displayName,
					email: user.email,
					createdAt: user.createdAt,
					image: user.image ?? "",
				};
			},
		}),
	],

	callbacks: {
		jwt({ token, trigger, session, user }) {
			if (trigger === "update" && session) {
				token.id = session.id;
				token.displayName = session.displayName;
				token.username = session.username;
				token.email = session.email;
				token.createdAt = session.createdAt;
				token.image = session.image;
			}

			if (user) {
				token.id = user.id;
				token.displayName = user.displayName;
				token.username = user.username;
				token.email = user.email;
				token.createdAt = user.createdAt;
				token.image = user.image;
			}
			return token;
		},

		session({ session, token }: { session: Session; token: JWT }) {
			session.user = {
				...session.user,
				id: token.id,
				displayName: token.displayName,
				username: token.username,
				email: token.email,
				createdAt: token.createdAt,
				image: token.image,
			};

			return session;
		},
	},

	session: {
		strategy: "jwt" as const,
	},
	cookies: {
		sessionToken: {
			name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
			options: {
				httpOnly: true,
				sameSite: "lax" as const,
				path: "/" as const,
				secure: isProd,
			},
		},
	},
	pages: {
		signIn: "/login",
	},
};

export const { handlers, signIn, signOut, auth } = NextAuth(config);
