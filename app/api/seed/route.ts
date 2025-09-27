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
			image TEXT NULL,
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
			profile TEXT DEFAULT NULL,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
		);
	`;
}

async function seedMessages() {
		await sql`
		CREATE TABLE IF NOT EXISTS messages (
			id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
			type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'system', 'file', 'reaction', 'reply')),
			room_id TEXT NOT NULL,
			sender_id UUID NOT NULL,
			content TEXT NOT NULL,
			edited BOOLEAN default FALSE,
			created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
			replyTo TEXT DEFAULT NULL,
			reactions JSONB DEFAULT '{}',
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


async function enableRLSAndPolicies() {
	// USERS
	await sql`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY users_read_all
	ON users
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY users_write_self
	ON users
	FOR ALL
	TO authenticated
	USING (id = auth.uid())
	WITH CHECK (id = auth.uid());
	`;

	// USER STATUS
	await sql`ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY user_status_read_all
	ON user_status
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY user_status_write_self
	ON user_status
	FOR ALL
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());
	`;

	// FRIENDS
	await sql`ALTER TABLE friends ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY friends_read_all
	ON friends
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY friends_write_if_involved
	ON friends
	FOR ALL
	TO authenticated
	USING (
		user1_id = auth.uid() OR
		user2_id = auth.uid() OR
		request_sender_id = auth.uid()
	)
	WITH CHECK (
		user1_id = auth.uid() OR
		user2_id = auth.uid() OR
		request_sender_id = auth.uid()
	);
	`;

	// ROOMS
	await sql`ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY rooms_read_all
	ON rooms
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY rooms_write_if_owner
	ON rooms
	FOR ALL
	TO authenticated
	USING (owner_id = auth.uid())
	WITH CHECK (owner_id = auth.uid());
	`;

	// ROOM MEMBERS
	await sql`ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY room_members_read_all
	ON room_members
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY room_members_write_self
	ON room_members
	FOR ALL
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());
	`;

	// MESSAGES
	await sql`ALTER TABLE messages ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY messages_read_all
	ON messages
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY messages_write_if_sender
	ON messages
	FOR ALL
	TO authenticated
	USING (sender_id = auth.uid())
	WITH CHECK (sender_id = auth.uid());
	`;

	// MESSAGE STATUS
	await sql`ALTER TABLE msg_status ENABLE ROW LEVEL SECURITY;`;
	await sql`
	CREATE POLICY msg_status_read_all
	ON msg_status
	FOR SELECT
	TO authenticated
	USING (TRUE);
	`;
	await sql`
	CREATE POLICY msg_status_write_self
	ON msg_status
	FOR ALL
	TO authenticated
	USING (user_id = auth.uid())
	WITH CHECK (user_id = auth.uid());
	`;
}


export async function GET() {

	try {
		return Response.json({ message: "Database policies set successfully" });
	} catch (error) {
		console.error("Policy setup failed:", error);
		return Response.json({ error }, { status: 500 });
	}
}