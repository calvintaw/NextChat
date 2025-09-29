"use client";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";
import { MessageType, Room, User } from "../../lib/definitions";
import { checkIfBlocked, deleteMsg, getRecentMessages } from "../../lib/actions";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { Tooltip } from "react-tooltip";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

type ChatboxProps = { recipient: User | Room; user: User; roomId: string; type: "dm" | "server" };

export function Chatbox({ recipient, user, roomId, type }: ChatboxProps) {
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [activePersons, setActivePersons] = useState<string[]>([]);
	const tempIdsRef = useRef<Set<string>>(new Set());
	const [initialLoading, setInitialLoading] = useState(true);
	const [isBlocked, setIsBlocked] = useState(false);

	useEffect(() => {
		// check if it's a DM and recipient exists
		if (type === "dm" && recipient) {
			const check = async () => {
				const blocked = await checkIfBlocked(user, recipient as User);
				setIsBlocked(blocked);
			};

			check();
		} else {
			setIsBlocked(false);
		}
	}, [type, recipient, user.id]);

	// const msgReceivedSound = useRef<HTMLAudioElement>(new Audio("/msg-noti.mp3")); // does not fit the vibe
	// const [offset, setOffset, removeOffset] = useLocalStorage("msg_offset"); // need to implement the rest

	// fetching msgs at startup and add listeners for typing event
	useEffect(() => {
		if (isBlocked) return;

		const fetchMessages = async () => {
			const recent = await getRecentMessages(roomId);
			setMessages((prev) => [...prev, ...recent]);
			setInitialLoading(false);
		};

		fetchMessages();

		const handleTypingStart = (displayName: string) => {
			setActivePersons((prev) => [...prev, displayName]);
		};

		const handleTypingStop = () => setActivePersons([]);

		socket.on("typing started", handleTypingStart);
		socket.on("typing stopped", handleTypingStop);

		return () => {
			socket.off("typing started", handleTypingStart);
			socket.off("typing stopped", handleTypingStop);
		};
	}, [isBlocked]);

	// handle incoming msg sockets from server / handle msg delete sockets
	useEffect(() => {
		if (isBlocked) return;

		const handleIncomingMsg = (msg: MessageType) => {
			setMessages((prev) => {
				if (msg.sender_id !== user.id) {
					// msgReceivedSound.current.volume = 0.25;
					// msgReceivedSound.current.currentTime = 0;
					// msgReceivedSound.current.play().catch((err) => console.error(err));

					return [...prev, msg];
				}

				const index = prev.findIndex((item) => item.tempId && tempIdsRef.current.has(item.tempId));
				if (index === -1) return [...prev, msg];

				const updated = [...prev];

				if (msg.tempId) tempIdsRef.current.delete(msg.tempId);
				updated[index] = { ...msg, tempId: undefined };

				return updated;
			});
		};

		const handleMessageDeleted = (id: string) => {
			console.log("msg delete: ", id);
			setMessages((prev) => {
				return prev.filter((msg) => msg.id !== id);
			});
		};

		const handleMessageEdited = (id: string, content: string) => {
			setMessages((prev) => {
				const index = prev.findIndex((item) => item.id === id);
				if (index === -1) return prev;

				const updated = [...prev];
				updated[index] = { ...updated[index], content, edited: true };
				return updated;
			});
		};

		const toggleReaction = async (id: string, userId: string, emoji: string, operation: "add" | "remove") => {
			setMessages((prev) => {
				const index = prev.findIndex((tx) => tx.id === id);
				if (index === -1) return prev;

				const newMsg = [...prev];
				const currentReactors = new Set(newMsg[index].reactions?.[emoji] || []);

				if (operation === "remove") {
					currentReactors.delete(userId);
				} else {
					currentReactors.add(userId);
				}

				newMsg[index] = {
					...newMsg[index],
					reactions: {
						...newMsg[index].reactions,
						[emoji]: [...currentReactors],
					},
				};
				return newMsg;
			});
		};

		socket.emit("join", roomId);
		socket.on("message", handleIncomingMsg);

		socket.on("message deleted", handleMessageDeleted);
		socket.on("message edited", handleMessageEdited);
		socket.on("add_reaction_msg", toggleReaction);
		socket.on("remove_reaction_msg", toggleReaction);

		return () => {
			socket.off("message", handleIncomingMsg);
			socket.off("message deleted", handleMessageDeleted);
			socket.off("message edited", handleMessageEdited);
			socket.off("add_reaction_msg", toggleReaction);
			socket.off("remove_reaction_msg", toggleReaction);
			socket.emit("leave", roomId);
		};
	}, [roomId, isBlocked]);

	const toast = useToast();

	const deleteMessage = async (id: string) => {
		if (isBlocked) return;

		const originalMsg = [...messages];
		setMessages((prev) => prev.filter((tx) => tx.id != id));
		const result = await deleteMsg(id, roomId);
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		}
	};

	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<>
			<div
				className="flex flex-1 min-lg:max-h-[calc(100vh-33px)] overflow-hidden flex-col shadow-md bg-contrast 
			"
			>
				<ChatProvider config={{ setMessages, messages, roomId, user, containerRef, isBlocked }}>
					<div
						ref={containerRef}
						className="flex-1 h-full flex flex-col overflow-y-auto py-4 px-1 pb-10 has-scroll-container"
						// className="flex-1 min-h-0 flex flex-col overflow-y-auto py-4 pb-10"
					>
						{type === "dm" && recipient && (
							<DirectMessageCard
								isBlocked={isBlocked}
								roomId={roomId}
								currentUserId={user.id}
								user={recipient as User}
							/>
						)}

						{type === "server" && isServerRoom(roomId) && recipient && (
							<ServerCardHeader isBlocked={isBlocked} user={user} server={recipient as Room} />
						)}

						{initialLoading ? (
							<Loading className="!w-full !flex-1"></Loading>
						) : (
							<ChatMessages messages={messages} deleteMessage={deleteMessage} />
						)}
					</div>

					<ChatInputBox
						initialLoading={initialLoading}
						isBlocked={isBlocked}
						tempIdsRef={tempIdsRef}
						setMessages={setMessages}
						roomId={roomId}
						user={user}
						activePersons={activePersons}
					/>
				</ChatProvider>
			</div>
			<Tooltip
				className="my-tooltip"
				id="chatbox-reactions-row-tooltip"
				border={`var(--tooltip-border)`}
				delayShow={100}
				positionStrategy="fixed"
			/>
			<Tooltip
				className="my-tooltip__chat"
				id="icon-message-dropdown-menu-id"
				border={`var(--tooltip-chat)`}
				delayShow={100}
				positionStrategy="fixed"
			/>
		</>
	);
}

//=====================

import ChatMessages from "./components/ChatMessages";
import ChatInputBox from "./components/ChatInputBox";
import { Avatar } from "../general/Avatar";
import { clsx } from "clsx";
import Link from "next/link";
import { isServerRoom } from "@/app/lib/utilities";
import { ChatProvider } from "./ChatBoxWrapper";
import Loading from "@/app/(root)/chat/[room_id]/loading";
import { useToast } from "@/app/lib/hooks/useToast";
import { DirectMessageCard } from "./components/ChatHeaderForDM";
import { ServerCardHeader } from "./components/ChatHeaderForServer";
import { useLocalStorage } from "@/app/lib/hooks/useStorage";

export const ServerList = ({ servers }: { servers: Room[] }) => {
	if (!servers || servers.length === 0) {
		return <p className="text-xs text-gray-500 mt-2">No servers in common</p>;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{servers.map((server) => (
				<Link
					key={server.id}
					href={server.type === "dm" ? `/chat/${server.id}` : `/chat/server/${server.id}`}
					className={clsx(
						"flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors duration-150",
						"bg-background/50 hover:bg-background/70 dark:bg-accent/50 dark:hover:bg-accent/70"
					)}
				>
					<Avatar
						src={server.profile ?? ""}
						displayName={server.name}
						size="size-8"
						radius="rounded-md"
						fontSize="text-sm"
						statusIndicator={false}
					/>
					<span className="font-medium text-sm truncate">{server.name}</span>
				</Link>
			))}
		</div>
	);
};
