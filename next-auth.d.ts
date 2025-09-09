import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			displayName: string;
			username: string;
			email: string;
			createdAt: string;
			image: string;
		} & DefaultSession["user"];
	}

	interface User extends DefaultUser {
		id: string;
		displayName: string;
		username: string;
		email: string;
		createdAt: string;
		image: string;
		name?: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		idToken?: string;
		id: string;
		displayName: string;
		username: string;
		email: string;
		image: string;
		createdAt: string;
	}
}
