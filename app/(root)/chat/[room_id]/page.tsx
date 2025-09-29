import { getUser } from "@/app/lib/actions";
import { Chatbox } from "@/app/ui/chat/Chatbox";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	const currentUser = session.user;

	const { room_id } = await params;

	const decodedRoomId = decodeURIComponent(room_id);
	const recipientId = decodedRoomId.split(":").filter((str) => str !== currentUser.id && str !== "@me")[0];
	const recipient = await getUser(recipientId);
	if (!recipient) {
		throw new Error("Recipient not found [The user you’re trying to chat with does not exist or is unavailable.]");
	}

	return <Chatbox roomId={decodedRoomId} type="dm" recipient={recipient} user={currentUser}></Chatbox>;
}
