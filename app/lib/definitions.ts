import { QueryClient } from "@tanstack/react-query";
import postgres from "postgres";
import * as z from "zod";

export const sql = postgres(process.env.POSTGRES_URL!, {
	ssl: "require",
	connect_timeout: 60,
	idle_timeout: 300,
	prepare: false,
});

export type NewsArticle = {
	source: { id: string | null; name: string };
	author: string | null;
	title: string;
	description: string | null;
	url: string;
	urlToImage: string | null;
	publishedAt: string;
	content: string | null;
};

export type NewsApiResponse = {
	status: string;
	totalResults: number;
	articles: NewsArticle[];
	message?: string;
	code?: string;
};

export const PostgresError = postgres.PostgresError;

export const createServerSchema = z.object({
	server_name: z
		.string()
		.min(3, "Server name must be at least 3 characters")
		.max(32, "Server name must be at most 32 characters"),
	visibility: z
		.string()
		.transform((val) => val.toLowerCase())
		.refine((val) => val === "private" || val === "public", {
			message: "Visibility must be either 'private' or 'public'",
		}),
	server_image: z.string().url("Server image must be a valid URL").or(z.literal("")),
});

export const SignupFormSchema = z.object({
	email: z.string({ required_error: "Email is required" }).trim().email("Invalid email address"),

	password: z
		.string({ required_error: "Password is required" })
		.min(8, "Password must be at least 8 characters")
		.max(32, "Password must be no more than 32 characters"),

	username: z
		.string({ required_error: "Username is required" })
		.trim()
		.min(3, "Username must be at least 3 characters")
		.max(32, "Username must be at most 32 characters")
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

	displayName: z
		.string({ required_error: "Display name is required" })
		.trim()
		.min(1, "Display name is required")
		.max(32, "Display name must be at most 32 characters"),
});

export type SignupFormUser = z.infer<typeof SignupFormSchema>;

export const LoginFormSchema = z
	.object({
		email: z.string().trim().email("Invalid email address").nullable(),
		username: z
			.string()
			.trim()
			.min(3, "Username must be at least 3 characters")
			.max(32, "Username must be at most 32 characters")
			.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
			.nullable(),
		password: z
			.string({ required_error: "Password is required" })
			.trim()
			.min(8, "Password must be at least 8 characters")
			.max(32, "Password must be no more than 32 characters"),
	})
	.refine((data) => data.email || data.username, {
		message: "Email or username is required",
		path: ["email"],
	});

export type LoginFormUser = z.infer<typeof LoginFormSchema>;

export type FormState = {
	errors: {
		username?: string[];
		displayName?: string[];
		email?: string[];
		password?: string[];
	};
	message: string;
};

export const timezoneOptions: Intl.DateTimeFormatOptions = {
	year: "2-digit",
	month: "2-digit",
	day: "2-digit",
	hour: "numeric",
	minute: "2-digit",
	hour12: true,
};

export type User = {
	id: string;
	image: string;
	username: string;
	displayName: string;
	email: string;
	createdAt?: string;
	password?: string;
};

export type MessageType = {
	id: string;
	sender_id: string;
	sender_display_name: string;
	sender_image: string;
	content: string;
	createdAt: string;
	type: "text" | "video" | "image" | "system" | "file" | "reaction" | "reply";
	edited: boolean;
	reactions: Record<string, string[]>;
	replyTo: string | null;
	tempId?: string;
};

export type ChatType = Omit<User, "createdAt"> & {
	room_id: string;
	online: boolean;
};

export type ContactType = Omit<User, "createdAt"> & {
	online: boolean;
};

type RoomType = "public" | "private" | "dm";

export type Room = {
	id: string;
	owner_id: string;
	name: string;
	description?: string;
	type: RoomType;
	created_at: string;
	online_members?: number;
	total_members?: number;
	banner?: string;
	profile?: string;
};

export type NewsApiParams = {
	q?: string;
	searchIn?: "title" | "description" | "content" | string;
	sources?: string;
	domains?: string;
	excludeDomains?: string;
	from?: string;
	to?: string;
	language?: string;
	sortBy?: "relevancy" | "popularity" | "publishedAt";
	pageSize?: number;
	page?: number;
};
