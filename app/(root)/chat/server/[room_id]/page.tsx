import { getServer, isMember } from "@/app/lib/actions";
import { Chatbox } from "@/app/ui/chat/Chatbox";
import { auth } from "@/auth";
import { User } from "@/app/lib/definitions";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) return null;
	const currentUser: User = session.user;

	const { room_id } = await params;
	const decodedRoomId = decodeURIComponent(room_id);

	// Fetch the server/room
	const recipient = await getServer(decodedRoomId);
	if (!recipient || recipient.length === 0) {
		// If server doesn't exist
		throw new Error("Server not found [The server might have been deleted or never existed] [disableReload]");
	}

	// Check if the user is a member
	const memberCheck = await isMember(currentUser.id, decodedRoomId);
	if (!memberCheck) {
		throw new Error("Access denied [You must be a member of this server to view it] [disableReload]");
	}

	return <Chatbox recipient={recipient[0]} type="server" roomId={decodedRoomId} user={currentUser} />;
}
