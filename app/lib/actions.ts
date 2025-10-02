"use server";
import { auth, signIn } from "@/auth";
import { AuthError } from "next-auth";
import {
	SignupFormSchema,
	FormState,
	LoginFormUser,
	sql,
	createServerSchema,
	User,
	MessageType,
	ChatType,
	PostgresError,
	ContactType,
	NewsArticle,
	NewsApiResponse,
	NewsApiParams,
	Room,
	MessageContentType,
} from "./definitions";
import bcrypt from "bcryptjs";
import z from "zod";
import { getDMRoom } from "./utilities";
import { newsData } from "./news";
import { socket } from "./socket";
import console, { error } from "console";
import { cookies } from "next/headers";
import { io } from "socket.io-client";
import { supabase } from "./supabase";

// Utility for easy access to the currently authenticated user.
// Functions using this tool could be refactored to not depend on it if needed.
async function withCurrentUser(callback: Function) {
	const session = await auth();
	const userId = session?.user?.id;
	if (!userId) throw new Error("not authenticated");
	return callback(session.user as User);
}

export async function getUser(user_id: string): Promise<User | null> {
	if (user_id.includes("system-room")) {
		const result = await sql<User[]>`
		SELECT id, username, display_name as "displayName", email, created_at as "createdAt", image FROM users WHERE username = ${"system"}
	`;

		return result[0] ?? null;
	}

	const result = await sql<User[]>`
		SELECT id, username, display_name as "displayName", email, created_at as "createdAt", image FROM users WHERE id = ${user_id} LIMIT 1
	`;

	return result[0] ?? null;
}

// one time use fn for displaying individual user info
export async function getUserForProfilePage(id: string): Promise<User | null> {
	const result = await sql<User[]>`
		SELECT id, username, display_name as "displayName", email, created_at as "createdAt", image, bio, readme FROM users WHERE id = ${id} LIMIT 1
	`;
	return result[0] ?? null;
}

export async function checkIfBlocked(user: User, friend: User): Promise<boolean> {
	const [user1_id, user2_id] = [user.id, friend.id].sort((a, b) => a.localeCompare(b));
	const result = await sql<{ status: string }[]>`
    SELECT status
    FROM friends
    WHERE user1_id = ${user1_id} AND user2_id = ${user2_id} LIMIT 1;
  `;

	if (result.length === 0) {
		return false;
	}

	return result[0].status === "blocked";
}

export async function getServersInCommon(currentUserId: string, targetUserId: string): Promise<Room[]> {
	return await sql`
		SELECT r.id, r.name, r.type, r.profile, r.owner_id
		FROM rooms r
		JOIN room_members rm ON r.id = rm.room_id
		WHERE rm.user_id IN (${currentUserId}, ${targetUserId}) AND r.type != 'dm'
		GROUP BY r.id, r.name, r.type, r.profile, r.owner_id
		HAVING COUNT(DISTINCT rm.user_id) = 2
	`;
}

export async function deleteMsg(
	id: string,
	type: MessageContentType,
	content: string
): Promise<{ success: true; message: string } | { success: false; message: string }> {
	try {
		await sql.begin(async (tx) => {
			await tx`
				DELETE FROM messages
				WHERE id = ${id}
			`;
		});

		if (type === "video" || type === "image") {
			let files: string[] = [];
			try {
				files = JSON.parse(content);
				if (!Array.isArray(files)) files = []; // guard in case it's not an array
			} catch (err) {
				console.error("Invalid message format", err);
				return { success: false, message: "Invalid message format" };
			}

			const { error } = await supabase.storage.from("uploads").remove(files);

			if (error) {
				console.error("Error deleting file:", error.message);
				return { success: false, message: "Failed to delete the message. Please try again!" };
			}
		}

		return { success: true, message: "Message deleted successfully." };
	} catch (error) {
		console.error("Error deleting message:", error);
		return { success: false, message: "Failed to delete the message. Please try again!" };
	}
}

export async function getChats(currentUserId: string): Promise<ChatType[]> {
	return await sql`
			SELECT 
				us.online as "online", 
				rm.room_id as "room_id", 
				u.id, 
				u.username, 
				u.display_name as "displayName", 
				u.image
			FROM room_members rm
			JOIN users u ON rm.user_id = u.id
			JOIN user_status us ON u.id = us.user_id
			JOIN room_members rm2 ON rm.room_id = rm2.room_id
			WHERE rm2.user_id = ${currentUserId}
			AND u.id != ${currentUserId};
		`;
}

export async function getContacts(currentUserId: string): Promise<ContactType[]> {
	return await sql`
			    SELECT 
					u.id,
					u.username,
					u.display_name AS "displayName",
					u.email as "email",
					u.image,
					us.online AS "online"
				FROM friends f
				JOIN users u ON (
					(f.user1_id = ${currentUserId} AND u.id = f.user2_id) OR
					(f.user2_id = ${currentUserId} AND u.id = f.user1_id)
				)
				JOIN user_status us ON us.user_id = u.id
				WHERE f.status = 'accepted';
		`;
}

interface GetMessagesOptions {
	cursor?: string; // defaults to 0
	limit?: number; // optional, number of messages to fetch
}

export async function getRecentMessages(room_id: string, options: GetMessagesOptions = {}) {
	const { cursor = "", limit = 15 } = options;

	let where = sql`m.room_id = ${room_id}`;
	if (cursor) {
		where = sql`${where} AND m.created_at < ${cursor}`;
	}

	return (await sql`
    SELECT 
      m.id,
      users.image AS "sender_image",
      m.sender_id, 
      users.display_name AS "sender_display_name", 
      m.content, 
      m.created_at AS "createdAt",
      m.type,
      m.edited,
      m.reactions,
      m.replyTo AS "replyTo"
    FROM messages m
    JOIN users ON m.sender_id = users.id
    WHERE ${where}
    ORDER BY m.created_at DESC
		LIMIT ${limit} 
		
  `) as MessageType[];
}

type LocalMessageType = MessageType & {
	room_id: string;
};

export async function insertMessageInDB(msg: LocalMessageType): Promise<{ success: boolean; message?: string }> {
	try {
		//TODO: make socket better
		await sql.begin(async (sql) => {
			await sql`
					INSERT INTO messages (id, room_id, sender_id, content, type, replyTo)
					VALUES (${msg.id}, ${msg.room_id}, ${msg.sender_id}, ${msg.content}, ${msg.type}, ${msg.replyTo})
				`;
		});

		console.log("Sent:", { name: msg.sender_display_name, msg: msg.content });
		return { success: true };
	} catch (error) {
		console.error("insertMessageInDB ERROR:", error);
		return {
			success: false,
			message: "Failed to send message. Please try again.",
		};
	}
}

export async function getSpecificMessage(id: string): Promise<MessageType | null> {
	const result: MessageType[] = await sql`
    SELECT 
		m.id,
      users.image AS "sender_image",
      m.sender_id, 
      users.display_name AS "sender_display_name", 
      m.content, 
      m.created_at AS "createdAt",
      m.type,
      m.edited,
      m.reactions,
      m.replyTo AS "replyTo"
    FROM messages m
    JOIN users ON m.sender_id = users.id
    WHERE m.id = ${id}
    LIMIT 1
  `;

	return result[0] ?? null;
}

export async function getServer(id: string): Promise<Room[]> {
	return await sql`
    SELECT * FROM rooms WHERE id = ${id} LIMIT 1
  `;
}

export async function getAllServers(userId?: string) {
	if (userId) {
		// Only return servers that the user has joined
		return (await sql<Room[]>`
      SELECT r.*, COUNT(rm.room_id) AS total_members
      FROM rooms r
      JOIN room_members rm2 ON r.id = rm2.room_id
      LEFT JOIN room_members rm ON r.id = rm.room_id
      WHERE r.type != 'dm'
        AND rm2.user_id = ${userId}
      GROUP BY r.id
    `) as Room[];
	} else {
		// Return all servers
		return (await sql<Room[]>`
      SELECT r.*, COUNT(rm.room_id) AS total_members
      FROM rooms r
      LEFT JOIN room_members rm ON r.id = rm.room_id
      WHERE r.type != 'dm'
      GROUP BY r.id
    `) as Room[];
	}
}

export async function editProfile(user: User, formData: FormData) {
	const parsedFormSchema = z.object({
		displayName: z.string().trim().min(1).max(50).optional(),
		username: z.string().trim().min(1).max(30).optional(),
		bio: z.string().trim().max(160).optional(),
		email: z.string().trim().email().optional(),
		image: z.string().url("Profile image must be a valid URL").or(z.literal("")),
	});

	const rawData = {
		displayName: formData.get("displayName")?.toString(),
		username: formData.get("username")?.toString(),
		email: formData.get("email")?.toString(),
		image: formData.get("server_image")?.toString(),
		bio: formData.get("bio")?.toString(),
	};

	const result = parsedFormSchema.safeParse(rawData);

	if (!result.success) {
		return {
			errors: result.error.flatten().fieldErrors,
			message: "Validation failed. Please check your input.",
			success: false,
			user: null,
		};
	}

	const { displayName = null, username = null, email = null, bio = null, image } = result.data ?? {};

	if (
		displayName === user.displayName &&
		username === user.username &&
		email === user.email &&
		image === user.image &&
		bio === user.bio
	) {
		return {
			errors: {},
			message: "No changes made to the profile.",
			success: true,
			user: null,
		};
	}

	// Check for duplicate username
	if (username && username !== user.username) {
		try {
			const duplicates = await sql`
          SELECT username FROM users
          WHERE username = ${username} AND id != ${user.id}
          LIMIT 1
        `;
			if (duplicates.length > 0 && duplicates[0].username === username) {
				return {
					errors: { username: ["Username already taken."] },
					message: "Please choose a different username.",
					success: false,
					user: null,
				};
			}
		} catch (err) {
			console.log("error in edit profile: ", error);
			return {
				errors: {},
				message: "Something went wrong while checking username.",
				success: false,
				user: null,
			};
		}
	}

	// Update the user in the database
	try {
		const rows = await sql<User[]>`
				UPDATE users
				SET
					display_name = ${displayName ?? user.displayName},
					username = ${username ?? user.username},
					email = ${email ?? user.email},
					image = ${image},
					bio = ${bio}
				WHERE id = ${user.id}
				returning id, username, display_name as "displayName", email, created_at as "createdAt", image, bio
			`;
		// returning data from db is uncessary (could be refactored to only use form field values on client side but too much work)

		if (rows.length === 0) {
			throw new Error("No Data Returned");
		}

		console.log("Profile updated successfully", result.data);

		return {
			errors: {},
			message: "Profile updated successfully.",
			success: true,
			user: rows[0],
		};
	} catch (err) {
		console.error("editProfile ERROR: ", err);
		return {
			errors: {},
			message: "Database Error: Failed to update profile.",
			success: false,
			user: null,
		};
	}
}

export async function editServer(formData: FormData, server: Room, currentUserId: string) {
	let result_server: Room | null = null;

	const parsedFormSchema = z.object({
		name: z.string().trim().min(1).max(32).optional(),
		description: z.string().trim().max(120).optional(),
		type: z.enum(["public", "private"]).optional(),
		profile: z.string().url("Profile image must be a valid URL").or(z.literal("")).optional(),
	});

	const rawData = {
		name: formData.get("name")?.toString(),
		description: formData.get("description")?.toString(),
		type: formData.get("type")?.toString(),
		profile: formData.get("server_image")?.toString(),
	};

	const result = parsedFormSchema.safeParse(rawData);

	if (!result.success) {
		return {
			errors: result.error.flatten().fieldErrors,
			message: "Validation failed. Please check your input.",
			success: false,
			server: result_server,
		};
	}

	const { name = null, description = null, type = null, profile = null } = result.data ?? {};

	try {
		const results: Room[] = await sql`
      UPDATE rooms
      SET
				name = ${name ?? server.name!},
				description = ${description ?? server.description!},
				type = ${type ?? server.type!},
				profile = ${profile ?? server.profile!}
      WHERE id = ${server.id} AND owner_id = ${currentUserId}
      RETURNING id, owner_id, name, description, type, profile, created_at
    `;

		result_server = results[0] ?? null;

		if (!result_server) {
			return {
				errors: {},
				message: "You do not have permission to edit this server.",
				success: false,
				server: result_server,
			};
		}
	} catch (err) {
		console.error("editServer ERROR:", err);
		return {
			errors: {},
			message: "Database Error: Failed to update server.",
			success: false,
			server: result_server,
		};
	}

	return {
		errors: {},
		message: "Server updated successfully.",
		success: true,
		server: result_server,
	};
}

export async function getJoinedServers(userId: string) {
	return (await sql`	
		select r.id, r.profile, r.name from rooms r
		join room_members rm on r.id = rm.room_id
		where rm.user_id = ${userId} and r.type != 'dm'
	`) as Room[];
}

export async function deleteServer(server_id: string) {
	return withCurrentUser(async (user: User) => {
		await sql`
        DELETE FROM rooms WHERE owner_id = ${user.id} AND id = ${server_id}
      `;
	});
}

export async function joinServer(room_id: string) {
	return withCurrentUser(async (user: User) => {
		await sql`
        INSERT INTO room_members (room_id, user_id)
        VALUES
          (${room_id}, ${user.id})
        ON CONFLICT DO NOTHING
      `;
	});
}

export async function createServer(formData: FormData): Promise<{ errors: {}; message: string; success: boolean }> {
	console.log("formData: ", formData);
	const parsedForm = createServerSchema.safeParse({
		server_name: formData.get("server_name"),
		visibility: formData.get("visibility"),
		server_image: formData.get("server_image"),
	});

	if (!parsedForm.success) {
		console.log("create server form pasring failed!");
		return {
			errors: parsedForm.error.flatten().fieldErrors,
			message: "Something happened. Please try again later!",
			success: false,
		};
	}
	const { server_name, visibility, server_image } = parsedForm.data;

	console.log("Creating server with:", { server_name, visibility, server_image });

	const authResult = await auth();
	if (!authResult?.user?.id) {
		console.log("authResult", authResult);
		throw new Error("User not authenticated");
	}
	const owner_id = authResult.user.id;
	const id = crypto.randomUUID();

	try {
		await sql.begin(async (sql) => {
			await sql`
					INSERT INTO rooms (id, owner_id, name, type, profile)
					VALUES (
						${id},
						${owner_id},
						${server_name},
						${visibility},
						${server_image}
					);
				`;

			await sql`
					INSERT INTO room_members (room_id, user_id, role)
					VALUES (
						${id},
						${owner_id},
						${"admin"}
					)
				`;
		});

		console.log("server created successfully");
		return {
			errors: {},
			message: "Server created successfully",
			success: true,
		};
	} catch (error) {
		console.error("Error creating server:", error);
		return {
			errors: {},
			message: "Database Error: Failed to create server",
			success: false,
		};
	}
}

export async function registerUser(formData: FormData): Promise<FormState> {
	const parsedForm = SignupFormSchema.safeParse({
		email: formData.get("email")?.toString().trim(),
		password: formData.get("password")?.toString().trim(),
		username: formData.get("username")?.toString().trim(),
		displayName: formData.get("displayName")?.toString().trim(),
	});

	if (!parsedForm.success) {
		return {
			errors: parsedForm.error.flatten().fieldErrors,
			message: "",
		};
	}

	const { email, password, username, displayName } = parsedForm.data;

	try {
		const duplicates = await sql`
      SELECT email, username FROM users
      WHERE email = ${email} OR username = ${username}
      LIMIT 1
    `;

		if (duplicates.length > 0) {
			const errors: FormState["errors"] = {};
			if (duplicates[0].email === email) {
				errors.email = ["Email already registered."];
			}
			if (duplicates[0].username === username) {
				errors.username = ["Username already taken."];
			}

			return {
				errors,
				message: "Please choose a different email or username.",
			};
		}
	} catch (error) {
		console.log("error in register User:", error);
		return {
			errors: {},
			message: "Something went wrong. Please try again.",
		};
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);

		await sql.begin(async (sql) => {
			const [{ id }] = await sql<{ id: string }[]>`
				INSERT INTO users (email, password, username, display_name)
				VALUES (${email}, ${hashedPassword}, ${username}, ${displayName})
				returning id;
			`;

			const result = await getUserIdByUsername("system");
			if (!result.success) return;
			const systemUserId = result.id!;
			const [user1_id, user2_id] = [id, systemUserId].sort((a, b) => a.localeCompare(b));
			const roomId = `system-room-${systemUserId}:${id}`;

			await sql`
				INSERT INTO friends (user1_id, user2_id, request_sender_id, status)
				VALUES (
					${user1_id},  -- deterministic system UUID
					${user2_id}::UUID,                            
					${id}::UUID,                             
					'accepted'
				);
			`;
			// Create system room
			await sql`
    INSERT INTO rooms (id, owner_id, description, type)
    VALUES (
      ${roomId},
      ${systemUserId},
      'Chat between system and user.',
      'dm'
    )
    ON CONFLICT (id) DO NOTHING;
  `;

			// Add members: system, new user
			await sql`
    INSERT INTO room_members (room_id, user_id, role)
    VALUES
      (${roomId}, ${systemUserId}, 'admin'),
      (${roomId}, ${id}, 'user')
    ON CONFLICT (user_id, room_id) DO NOTHING;
  `;

			await sql<LoginFormUser[]>`
				INSERT INTO user_status (user_id, online)
				VALUES (${id}, true)
			`;
		});
	} catch (error) {
		console.log("error in register user:", error);
		return {
			errors: {},
			message: "Database Error: Failed to create account",
		};
	}

	await signIn("credentials", {
		email,
		password,
		username,
		redirect: false,
	});

	await (
		await cookies()
	).set("theme", "dark", {
		path: "/",
		maxAge: 60 * 60 * 24 * 30, // 30 days
	});

	return {
		errors: {},
		message: "",
	};
}

export async function authenticate(prevState: string | undefined, formData: FormData) {
	try {
		const indentifier = formData.get("identifier");
		const EmailSchema = z.string().trim().email();
		const emailResult = EmailSchema.safeParse(indentifier);
		console.log(indentifier);

		const data = {
			email: emailResult.success ? indentifier : null,
			password: formData.get("password"),
			username: !emailResult.success ? indentifier : null,
		};

		await signIn("credentials", { ...data, redirectTo: "/dashboard" });
	} catch (error) {
		if (error instanceof AuthError) {
			switch (error.type) {
				case "CredentialsSignin":
					return "Invalid credentials.";
				default:
					return "Something went wrong.";
			}
		}
		throw error;
	}
}

export async function updateOnlineStatus(status: boolean, user_id: string) {
	try {
		await sql`UPDATE user_status set online = ${status} where user_id = ${user_id}`;
	} catch (error) {
		console.log(error);
	}
}

export async function getFriendRequests(userId: string) {
	try {
		const incoming: User[] = await sql<User[]>`
      SELECT
        users.id,
        users.username,
        users.display_name AS "displayName",
        users.email,
        users.created_at AS "createdAt"
      FROM friends
      JOIN users ON friends.request_sender_id = users.id
      WHERE (friends.user1_id = ${userId} OR friends.user2_id = ${userId})
        AND friends.status = 'pending'
        AND friends.request_sender_id != ${userId};
    `;

		const sent: User[] = await sql<User[]>`
			SELECT
				users.id,
				users.username,
				users.display_name AS "displayName",
				users.email,
				users.created_at AS "createdAt"
			FROM friends
			JOIN users ON users.id = CASE
				WHEN friends.user1_id = ${userId} THEN friends.user2_id
				ELSE friends.user1_id
			END
			WHERE friends.status = 'pending'
				AND friends.request_sender_id = ${userId};
    `;

		return { sent, incoming };
	} catch (error) {
		console.error("Error fetching friend requests:", error);
		throw new Error("Failed to fetch friend requests.");
	}
}

export async function deleteDM(targetUser: MinimalUserType): Promise<{ success: boolean; message: string }> {
	return withCurrentUser(async (currentUser: User) => {
		try {
			console.log(`Deleting DM between ${currentUser.username} and ${targetUser.username}...`);

			const room_id = getDMRoom(currentUser.id, targetUser.id);

			await sql.begin(async (sql) => {
				await sql`
				DELETE FROM rooms
				WHERE id = ${room_id}
			`;

				await sql`
				DELETE FROM room_members
				WHERE room_id = ${room_id}
			`;
			});

			console.log(`Success! Deleted DM with ${targetUser.username}.`);
			return { success: true, message: `Deleted DM with ${targetUser.username}.` };
		} catch (error) {
			console.error("Error deleting DM:", error);
			return { success: false, message: "Failed to delete DM. Please try again later." };
		}
	});
}

export async function createDM(
	targetUser: MinimalUserType
): Promise<{ success: boolean; message: string; roomId?: string }> {
	return withCurrentUser(async (currentUser: User) => {
		try {
			console.log(`Creating DM between ${currentUser.username} and ${targetUser.username}...`);

			// Generate a new room ID
			const room_id = getDMRoom(currentUser.id, targetUser.id);

			await sql.begin(async (sql) => {
				// Insert into rooms
				await sql`
					INSERT INTO rooms (id, type)
					VALUES (${room_id}, 'dm')
				`;

				// Insert members
				await sql`
					INSERT INTO room_members (room_id, user_id)
					VALUES 
						(${room_id}, ${currentUser.id}),
						(${room_id}, ${targetUser.id})
				`;
			});

			console.log(`Success! Created DM with ${targetUser.username}.`);
			return { success: true, message: `Created DM with ${targetUser.username}.`, roomId: room_id };
		} catch (error) {
			console.error("Error creating DM:", error);
			return { success: false, message: "Failed to create DM. Please try again later." };
		}
	});
}

export async function requestFriendship(
	prevState: { success: boolean; message: string },
	formData: FormData
): Promise<{ success: boolean; message: string; targetUser?: User }> {
	return withCurrentUser(async (currentUser: User) => {
		try {
			const username = z.string().min(1).parse(formData.get("username"));
			console.log("Sarting friendship request. Console log");

			if (username === currentUser.username) {
				return {
					success: false,
					message: "Well, you can't add yourself as a friend.",
				};
			}

			const [targetUser] = await sql`SELECT 
			id,
			image,
			username,
			display_name as "displayName",
			email
			from users WHERE username = ${username} LIMIT 1`;
			const [user1_id, user2_id] = [targetUser.id, currentUser.id].sort((a, b) => a.localeCompare(b));

			await sql.begin(async (tx) => {
				await tx`
					INSERT INTO friends (user1_id, user2_id, request_sender_id,  status)
					VALUES (${user1_id}, ${user2_id}, ${currentUser.id}, 'pending')
				`;
			});

			console.log(`Success! Your friend requests to ${username} was sent.`);
			// socket.emit("refresh-contacts-page", currentUser.id, targetUser.id);

			return {
				success: true,
				message: `Success! Your friend requests to ${username} was sent.`,
				targetUser,
			};
		} catch (error) {
			if (error instanceof PostgresError && error.code === "23505") {
				// Unique violation from Postgres meaning friendship already exists
				return { success: false, message: "You already have a pending or accepted friendship with this user." };
			}

			console.log("error in request friendship:", error);
			return {
				success: false,
				message: "Hm, didn't work. Double check that the username is correct.",
			};
		}
	});
}

type MinimalUserType = {
	id: string;
	username: string;
};

export async function removeFriendshipRequest(
	targetUser: MinimalUserType,
	type: "incoming" | "sent" | "friend"
): Promise<{ success: boolean; message: string }> {
	return withCurrentUser(async (currentUser: User) => {
		try {
			console.log("Starting friendship cancel.");

			const [user1_id, user2_id] = [targetUser.id, currentUser.id].sort((a, b) => a.localeCompare(b));

			if (type === "sent") {
				const existing = await sql`
          SELECT status FROM friends
          WHERE user1_id = ${user1_id} AND user2_id = ${user2_id}
          LIMIT 1
        `;

				if (existing.length > 0 && existing[0].status === "accepted") {
					return {
						success: false,
						message: `${targetUser.username} has already accepted your request.`,
					};
				}
			}

			await sql.begin(async (tx) => {
				await tx`
			DELETE FROM friends
			WHERE user1_id = ${user1_id} AND user2_id = ${user2_id}
		`;
			});

			console.log(`Success! Removed friend request to ${targetUser.username}.`);
			// socket.emit("refresh-contacts-page", currentUser.id, targetUser.id);

			return { success: true, message: `Removed friend request to ${targetUser.username}.` };
		} catch (error) {
			console.error("error in remove friend req: ", error);
			return { success: false, message: "Oops, an error occurred! Please try again later." };
		}
	});
}

export async function blockFriendship(
	currentUserId: string,
	targetUserId: string
): Promise<{ success: boolean; message: string }> {
	try {
		const [user1_id, user2_id] = [currentUserId, targetUserId].sort((a, b) => a.localeCompare(b));

		await sql.begin(async (tx) => {
			await tx`
        UPDATE friends
        SET status = 'blocked',
            request_sender_id = ${currentUserId}
        WHERE user1_id = ${user1_id}
          AND user2_id = ${user2_id};
      `;
		});

		return {
			success: true,
			message: `${targetUserId} has been blocked.`,
		};
	} catch (error) {
		console.error("blockFriendship error:", error);
		return {
			success: false,
			message: "Oops, an error occurred! Please try again later.",
		};
	}
}

export async function unblockFriendship(
	currentUserId: string,
	targetUserId: string
): Promise<{ success: boolean; message: string }> {
	try {
		const [user1_id, user2_id] = [currentUserId, targetUserId].sort((a, b) => a.localeCompare(b));

		await sql.begin(async (tx) => {
			await tx`
        UPDATE friends
        SET status = 'accepted',
            request_sender_id = NULL
        WHERE user1_id = ${user1_id}
          AND user2_id = ${user2_id}
          AND status = 'blocked';
      `;
		});

		return {
			success: true,
			message: `${targetUserId} has been unblocked.`,
		};
	} catch (error) {
		console.error("unblockFriendship error:", error);
		return {
			success: false,
			message: "Oops, an error occurred! Please try again later.",
		};
	}
}

export async function acceptFriendshipRequest(targetUser: User): Promise<{ success: boolean; message: string }> {
	return withCurrentUser(async (currentUser: User) => {
		try {
			console.log("Starting friendship accept...");

			const room_id = getDMRoom(targetUser.id, currentUser.id);
			const [user1_id, user2_id] = [currentUser.id, targetUser.id].sort((a, b) => a.localeCompare(b));

			await sql.begin(async (tx) => {
				await tx`
        UPDATE friends
        SET status = 'accepted'
        WHERE user1_id = ${user1_id} 
					AND user2_id = ${user2_id}
      `;

				await tx`
        INSERT INTO rooms (id, type)
        VALUES (${room_id}, 'dm')
        ON CONFLICT DO NOTHING
      `;

				await tx`
        INSERT INTO room_members (room_id, user_id)
        VALUES
          (${room_id}, ${currentUser.id}),
          (${room_id}, ${targetUser.id})
        ON CONFLICT DO NOTHING
      `;
			});

			console.log(`Success! Accepted friend request from ${targetUser.username}.`);
			// socket.emit("refresh-contacts-page", currentUser.id, targetUser.id);

			return {
				success: true,
				message: `Friend request from ${targetUser.username} accepted.`,
			};
		} catch (error) {
			console.error("error in accept friend req", error);
			return {
				success: false,
				message: `Failed to accept friend request from ${targetUser.username}. Please try again.`,
			};
		}
	});
}

export async function fetchNews(config?: NewsApiParams): Promise<NewsArticle[]> {
	if (process.env.NODE_ENV === "production") {
		return newsData.articles;
	}
	try {
		const q = config?.q || "";
		const url = new URL(`https://newsapi.org/v2/${q === "home" ? "top-headlines?sources=bbc-news" : "everything"}`);

		const defaults: NewsApiParams = {
			q,
			language: "en",
			pageSize: 20,
		};

		const params = { ...defaults, ...config };

		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		});

		url.searchParams.set("apiKey", process.env.NEWS_API_KEY || "");

		const res = await fetch(url.toString());
		const data: NewsApiResponse = await res.json();

		if (!res.ok || data.status === "error") {
			throw new Error(data.message || `${data.code || "Error"}: Failed to fetch news`);
		}

		if (data.status === "ok") {
			return data.articles ?? [];
		}

		throw new Error("Unexpected API response structure");
	} catch (err) {
		console.error("Network/server error:", err);
		return [];
	}
}

export async function mockFetchNews() {
	return { articles: newsData.articles as NewsArticle[], error: "" };
}

export async function editMsg({
	id,
	content,
}: {
	id: string;
	content: string;
}): Promise<{ success: true; message: string } | { success: false; error: any; message: string }> {
	return withCurrentUser(async (user: User) => {
		try {
			await sql.begin(async (tx) => {
				await tx`
				UPDATE messages
				set content = ${content}, edited = ${true}
				WHERE id = ${id} AND sender_id = ${user.id}
			`;
			});
			return { success: true, message: "Message edited successfully." };
		} catch (error) {
			console.log("error in edit msg: ", error);
			return { success: false, error, message: "Failed to edit the message. Please try again." };
		}
	});
}

export async function addReactionToMSG({
	id,
	userId,
	roomId,
	emoji,
}: {
	id: string;
	userId: string;
	roomId: string;
	emoji: string;
}): Promise<{ success: true; message: string } | { success: false; error: any; message: string }> {
	try {
		await sql.begin(async (tx) => {
			await tx`
				UPDATE messages
				SET reactions = jsonb_set(
						reactions,
						ARRAY[${emoji}],
						(
								SELECT to_jsonb(array_agg(DISTINCT elem))
								FROM (
										SELECT jsonb_array_elements_text(COALESCE(reactions->${emoji}, '[]'::jsonb)) AS elem
										UNION ALL
										SELECT ${userId}
								) 
						)
				)
				WHERE id = ${id};
			`;
		});

		return { success: true, message: "Reaction added successfully." };
	} catch (error) {
		console.log("error in add reactiont to msg: ", error);

		return { success: false, message: "Failed to add reaction. Please try again.", error };
	}
}

export async function removeReactionFromMSG({
	id,
	userId,
	roomId,
	emoji,
}: {
	id: string;
	userId: string;
	roomId: string;
	emoji: string;
}): Promise<{ success: true; message: string } | { success: false; error: any; message: string }> {
	try {
		await sql.begin(async (tx) => {
			await tx`
UPDATE messages
SET reactions = jsonb_set(
    reactions,
    ARRAY[${emoji}],
    COALESCE(
        (
            SELECT to_jsonb(array_agg(elems))
            FROM jsonb_array_elements_text(COALESCE(reactions->${emoji}, '[]'::jsonb)) elems
            WHERE elems <> ${userId}
        ),
        '[]'::jsonb
    )
)
WHERE id = ${id};

			`;
		});
		return { success: true, message: "Reaction removed successfully." };
	} catch (error) {
		console.log("error in remove reaction msg: ", error);

		return { success: false, message: "Failed to remove reaction. Please try again.", error };
	}
}

export async function getUsername(id: string) {
	const result = await sql<User[]>`
		SELECT username from users where id = ${id} LIMIT 1
	`;
	if (result.length === 0) {
		return { success: false };
	}
	return { success: true, username: result[0].username };
}

export async function getUserIdByUsername(username: string) {
	const result = await sql<User[]>`
		SELECT id from users where username = ${username} LIMIT 1
	`;
	if (result.length === 0) {
		return { success: false };
	}
	return { success: true, id: result[0].id };
}

export async function getReadmeByUsername(username: string) {
	const result = await sql<User[]>`
		SELECT readme from users where username = ${username} LIMIT 1
	`;
	if (result.length === 0) {
		return { success: false };
	}
	return { success: true, readme: result[0].readme };
}

export async function updateReadmeByUsername(readme: string) {
	return withCurrentUser(async (user: User) => {
		try {
			await sql`
        UPDATE users
        SET readme = ${readme}
        WHERE id = ${user.id}
      `;
			return { success: true, message: "README.md updated successfully." };
		} catch (error) {
			console.error("updateReadmeByUsername ERROR:", error);
			return { success: false, message: "Failed to update README.md Please try again." };
		}
	});
}

export async function getBioByUsername(username: string) {
	const result = await sql<User[]>`
		SELECT bio from users where username = ${username} LIMIT 1
	`;
	if (result.length === 0) {
		return { success: false };
	}
	return { success: true, readme: result[0].bio };
}
