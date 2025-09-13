import { getServer } from "@/app/lib/actions";
import { Chatbox } from "@/app/ui/chat/Chatbox";
import { auth } from "@/auth";
import { User } from "@/app/lib/definitions";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) return null;
	const currentUser: User = session.user;
	const { room_id } = await params;

	const recipient = await getServer(room_id);
	if (!recipient || recipient.length === 0) {
		redirect("/");
	}
	const decodedRoomId = decodeURIComponent(room_id);

	return <Chatbox recipient={recipient[0]} type="server" roomId={decodedRoomId} user={currentUser }></Chatbox>;
}
