import { getUser } from "@/app/lib/actions";
import { Chatbox } from "@/app/ui/chat/Chatbox";
import { auth } from "@/auth";
import React from "react";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) return null;
	const currentUser = session.user;

	const { room_id } = await params;

	const decodedRoomId = decodeURIComponent(room_id);
	const recipientId = decodedRoomId.split(":").filter((str) => str !== currentUser.id && str !== "@me")[0];
	const recipient = await getUser(recipientId);
	if (!recipient) return null;

	return <Chatbox roomId={decodedRoomId} type="dm" recipient={recipient} user={currentUser}></Chatbox>;
} 
