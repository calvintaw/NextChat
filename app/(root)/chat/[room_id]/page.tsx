import { getUser } from "@/app/lib/actions";
import { Chatbox } from "@/app/ui/chat/Chatbox";
import { auth } from "@/auth";
import { User } from "next-auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	const currentUser = session.user;

	const { room_id } = await params;
	const decodedRoomId = decodeURIComponent(room_id);

	if (room_id.startsWith("system-room")) {
		const SYSTEM_USER = {
			id: process.env.SYSTEM_USER_ID!,
			username: process.env.SYSTEM_USER_USERNAME!,
			email: process.env.SYSTEM_USER_EMAIL!,
			displayName: process.env.SYSTEM_USER_DISPLAY_NAME!,
			image: process.env.SYSTEM_USER_IMAGE!,
		} as User;

		return <Chatbox roomId={decodedRoomId} type="dm" recipient={SYSTEM_USER} user={currentUser}></Chatbox>;
	}

	const recipientId = decodedRoomId.split(":").filter((str) => str !== currentUser.id && str !== "@me")[0];
	const recipient = await getUser(recipientId);
	if (!recipient) {
		throw new Error("Recipient not found [The user you’re trying to chat with does not exist or is unavailable.]");
	}

	return <Chatbox roomId={decodedRoomId} type="dm" recipient={recipient} user={currentUser}></Chatbox>;
}
