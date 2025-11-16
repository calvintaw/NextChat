import { sql } from "@/app/lib/definitions";
import { seedRegisterUsers } from "@/app/lib/seedUsers";

async function resetTables() {
	await sql`DROP TABLE IF EXISTS msg_status CASCADE`;
	await sql`DROP TABLE IF EXISTS messages CASCADE`;
	await sql`DROP TABLE IF EXISTS room_members CASCADE`;
	await sql`DROP TABLE IF EXISTS rooms CASCADE`;
	await sql`DROP TABLE IF EXISTS friends CASCADE`;
}

async function seedUsers() {
	await sql`
		CREATE TABLE IF NOT EXISTS users (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			username VARCHAR(32) NOT NULL UNIQUE,
			display_name VARCHAR(32) NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			image TEXT,
			bio VARCHAR(160),
			readme TEXT,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
		);
	`;
}

async function seedRooms() {
	await sql`
		CREATE TABLE IF NOT EXISTS rooms (
			id TEXT PRIMARY KEY,
			owner_id UUID,
			name VARCHAR(32) UNIQUE,
			description VARCHAR(120),
			type TEXT NOT NULL CHECK (type IN ('public', 'private', 'dm')),
			banner TEXT,
			profile TEXT,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`;
}

async function seedMessages() {
	await sql`
		CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'video-call', 'file', 'link')),
			room_id TEXT NOT NULL,
			sender_id UUID NOT NULL,
			content TEXT NOT NULL,
			edited BOOLEAN default FALSE,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			replyTo TEXT DEFAULT NULL,
			reactions JSONB DEFAULT '{}',
			reaction_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
			FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`;
}

async function seedRoomMembers() {
	await sql`
		CREATE TABLE IF NOT EXISTS room_members (
			room_id TEXT NOT NULL,
			user_id UUID NOT NULL,
			role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

			PRIMARY KEY (user_id, room_id),
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
		);
	`;
}

async function seedFriends() {
	await sql`
  CREATE TABLE IF NOT EXISTS friends (
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    request_sender_id UUID NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
		created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (request_sender_id) REFERENCES users(id) ON DELETE CASCADE,

    CONSTRAINT ordered_pair CHECK (user1_id < user2_id),

		CONSTRAINT valid_sender CHECK (request_sender_id = user1_id OR request_sender_id = user2_id)
  );
`;
}

async function seedMessageStatus() {
	await sql`
		CREATE TABLE IF NOT EXISTS msg_status (
			msg_id UUID REFERENCES messages(id) ON DELETE CASCADE,
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			seen BOOLEAN DEFAULT FALSE,
			seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (msg_id, user_id)
		);
	`;
}

async function seedOnlineStatus() {
	await sql`
    CREATE TABLE IF NOT EXISTS user_status (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      online BOOLEAN DEFAULT TRUE,
      PRIMARY KEY (user_id)
    );
  `;
}

async function seedSnakeGameLeaderBoard() {
	await sql`
		CREATE TABLE IF NOT EXISTS snake_scores (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  best_score INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
	);
	`;
}

export async function GET() {
	try {
		await sql`
ALTER TABLE rooms
ADD COLUMN banner TEXT;
		`;
		return Response.json({ message: "Database policies set successfully" });
	} catch (error) {
		console.error("Policy setup failed:", error);
		return Response.json({ error }, { status: 500 });
	}
}
