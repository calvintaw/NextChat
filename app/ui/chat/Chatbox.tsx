"use client";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";
import { MessageContentType, MessageType, Room, User } from "../../lib/definitions";
import { checkIfBlocked, deleteMsg, getRecentMessages } from "../../lib/actions";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { Tooltip } from "react-tooltip";
import { get as getCache, set as setCache } from "idb-keyval";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

type ChatboxProps = { recipient: User | Room; user: User; roomId: string; type: "dm" | "server" };
const getRoomMessagesKey = (roomId: string) => `chat_messages_${roomId}`;

// const exampleMessages: MessageType[] = Array.from({ length: 35 }, (_, i) => ({
// 	id: `msg_${i + 1}`,
// 	sender_id: i % 2 === 0 ? "a6d4886d-1049-4f32-89e0-28a8394e0346" : "c10c579b-5a89-4439-925f-75c5d643d850",
// 	sender_display_name: i % 2 === 0 ? "Alice" : "Bob",
// 	sender_image:
// 		i % 2 === 0 ? "https://randomuser.me/api/portraits/women/1.jpg" : "https://randomuser.me/api/portraits/men/2.jpg",
// 	content: `This is message number ${i + 1}`,
// 	createdAt: new Date(Date.now() - (35 - i) * 60000).toISOString(), // spaced 1 minute apart
// 	type: "text",
// 	edited: false,
// 	reactions: {}, // some reactions
// 	replyTo: null,
// 	tempId: i >= 30 ? `temp_${i + 1}` : undefined, // last 5 messages tempId
// 	synced: i >= 30 ? "pending" : true,
// }));

export function Chatbox({ recipient, user, roomId, type }: ChatboxProps) {
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [activePersons, setActivePersons] = useState<string[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isBlocked, setIsBlocked] = useState(false);
	const examplePassageKeys = Object.keys(examplePassages) as Array<keyof typeof examplePassages>;
	const [ChatBotTopic, setChatBotTopic] = useState<keyof typeof examplePassages>(examplePassageKeys[0]);
	const [isSystem, setIsSystem] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<HTMLDivElement>(null);
	const scrollHeightBefore = useRef(0);
	const offsetRef = useRef(0);
	const limit = 15;
	const lastBatchLength = useRef(limit);
	const oldestMsgCreatedAt = useRef<string>("");
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingOldMsg, setIsLoadingOldMsg] = useState(false);
	const messageIdsRef = useRef<Set<string>>(new Set());

	//checks duplicates (due to netwrok errors, etc)
	const filterNewMessages = (msgs: MessageType[]) => {
		return msgs.filter((msg) => {
			if (messageIdsRef.current.has(msg.id)) return false;
			messageIdsRef.current.add(msg.id);
			return true;
		});
	};

	const sortMessagesAsc = (msgs: MessageType[]) =>
		[...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

	useEffect(() => {
		// check if it's a DM and recipient exists
		if (type === "dm" && recipient) {
			const check = async () => {
				const blocked = await checkIfBlocked(user, recipient as User);
				setIsBlocked(blocked);
				setInitialLoading(false);
			};

			check();
		} else {
			setIsBlocked(false);
		}

		if (roomId.startsWith("system-room")) {
			// setIsSystem(true); //p
			// setIsBlocked(true);
			setInitialLoading(false);
		}
	}, [type, recipient, user.id]);

	const LIMIT = 15;
	// const msgReceivedSound = useRef<HTMLAudioElement>(new Audio("/msg-noti.mp3")); // does not fit the vibe

	// fetching msgs at startup and add listeners for typing event
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) {
			setInitialLoading(false);
			setHasMore(false);
			return;
		}

		const fetchMessages = async () => {
			// cache feature: disabled as I do not know how to sync msgs if the other users change the msg
			if (roomId.startsWith("system-room")) {
				try {
					const cached: MessageType[] | undefined = await getCache(getRoomMessagesKey(roomId));
					if (cached && cached.length > 0) {
						offsetRef.current = cached.length;
						lastBatchLength.current = cached.length;
						oldestMsgCreatedAt.current = cached[cached.length - 1].createdAt;
						setMessages(cached);
						setInitialLoading(false);
						return;
					}
				} catch (err) {
					console.error("IDB load error:", err);
				}
			}

			try {
				const recent = await getRecentMessages(roomId, { limit: LIMIT });
				if (recent.length !== 0) {
					offsetRef.current = recent.length;
					lastBatchLength.current = recent.length;
					oldestMsgCreatedAt.current = recent[recent.length - 1].createdAt;
					setMessages(sortMessagesAsc(filterNewMessages(recent)));
				} else {
					setHasMore(false);
				}
			} catch (err) {
				console.error("Failed to fetch recent messages:", err);
				throw new Error("Failed to load recent messages [Please check your connection or try again later.]");
			}
		};

		fetchMessages();

		const handleTypingStart = (displayName: string) => {
			setActivePersons((prev) => {
				if (!prev.includes(displayName)) {
					return [...prev, displayName];
				}
				return prev;
			});
		};

		const handleTypingStop = (displayName: string) => {
			setActivePersons((prev) => prev.filter((name) => name !== displayName));
		};

		socket.on("typing started", handleTypingStart);
		socket.on("typing stopped", handleTypingStop);

		return () => {
			socket.off("typing started", handleTypingStart);
			socket.off("typing stopped", handleTypingStop);
		};
	}, [isBlocked, isSystem]);

	// handle incoming msg sockets from server / handle msg delete sockets
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) return;

		const handleIncomingMsg = async (msg: MessageType) => {
			// no need to add to msg array again as it is optimally added for quick UI feedback just as user sent the msg
			// the below line can be removed as socket will only send to all other users in the room except the sender itself now
			// but keeping it for extra safety
			if (msg.sender_id === user.id) return;

			// check duplicate
			if (messageIdsRef.current.has(msg.id)) return;
			messageIdsRef.current.add(msg.id);

			console.log("msg received: from chatbox: ", msg);
			setMessages((prev) => [...prev, msg]);
		};

		const handleMessageDeleted = (id: string) => {
			messageIdsRef.current.delete(id);

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

		socket.on("message", handleIncomingMsg);
		socket.on("message deleted", handleMessageDeleted);
		socket.on("message edited", handleMessageEdited);
		socket.on("add_reaction_msg", toggleReaction);
		socket.on("remove_reaction_msg", toggleReaction);

		console.log("ROOM ID: ", roomId);

		return () => {
			socket.off("message", handleIncomingMsg);
			socket.off("message deleted", handleMessageDeleted);
			socket.off("message edited", handleMessageEdited);
			socket.off("add_reaction_msg", toggleReaction);
			socket.off("remove_reaction_msg", toggleReaction);
		};
	}, [roomId, isBlocked, isSystem]);

	useEffect(() => {
		socket.emit("join", roomId);
		if (roomId.startsWith("system-room")) {
			preloadQnAModel().catch((err) => {
				console.error("Failed to load QnA model:", err);
				throw new Error(`Unable to load the bot at the moment [Please try again later or refresh the page]`);
			});
		}

		return () => {
			socket.emit("leave", roomId);
		};
	}, [roomId]);

	const toast = useToast();

	const deleteMessage = async (id: string, type: MessageContentType = "text", content: string) => {
		if (isBlocked || (isSystem && isBlocked)) return;

		const originalMsg = [...messages];

		// local update
		setMessages((prev) => prev.filter((tx) => tx.id != id));
		const result = await deleteMsg(id, type, content);
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		} else {
			socket.emit("delete message", id, roomId);
		}
		messageIdsRef.current.delete(id);
	};

	// generated by ChatGPT (I have no idea how to implement it so I "offloaded" the work)
	// edit: I did have to heavily modify the code to get it working how I want but ofc, there's still some AI help involved
	const fetchOlderMessages = async () => {
		if (!hasMore || !containerRef.current || isLoadingOldMsg || initialLoading || lastBatchLength.current < limit)
			return;

		setIsLoadingOldMsg(true);

		const olderMessages = await getRecentMessages(roomId, {
			cursor: oldestMsgCreatedAt.current,
			limit,
		});
		lastBatchLength.current = olderMessages.length;

		if (olderMessages.length < limit) setHasMore(false);
		offsetRef.current += olderMessages.length;

		if (olderMessages.length === 0) {
			setIsLoadingOldMsg(false);
			return;
		}
		oldestMsgCreatedAt.current = olderMessages.length >= 1 ? olderMessages[olderMessages.length - 1].createdAt : "";

		const scrollContainer = containerRef.current;
		scrollHeightBefore.current = scrollContainer.scrollHeight;

		// prepend messages
		const uniqueOlder = filterNewMessages(olderMessages);

		setMessages((prev) => [...sortMessagesAsc(uniqueOlder), ...prev]);
		setIsLoadingOldMsg(false);
	};
	// end of ai code

	// observes the first msg in the msg array
	const isTopVisible = useOnScreen(observerRef, "0px", hasMore);
	useEffect(() => {
		if (isTopVisible) {
			fetchOlderMessages();
		}
	}, [isTopVisible]);

	// effect for keeping the same scroll position if any older msg are loaded
	useEffect(() => {
		if (!containerRef.current || scrollHeightBefore.current === 0) return;

		const container = containerRef.current;
		const diff = container.scrollHeight - scrollHeightBefore.current;
		container.scrollTop += diff;
		scrollHeightBefore.current = 0;
	}, [messages]);

	// effect for setting scroll position to bottom of chat if firstRender

	const isFirstRender = useRef(true);

	useEffect(() => {
		if (containerRef.current && !initialLoading && messages.length !== 0 && isFirstRender.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
			isFirstRender.current = false;
		}
	}, [initialLoading, messages]);

	// cache msg in client browser
	useEffect(() => {
		if (messages.length > 0) {
			const messagesToSave = messages.slice(-50); // last 50 messages
			setCache(getRoomMessagesKey(roomId), messagesToSave).catch((err) => console.error("IDB save error:", err));
		}
	}, [messages, roomId]);

	return (
		<>
			<div
				className="flex flex-1 min-lg:max-h-[calc(100vh-33px)] overflow-hidden flex-col shadow-md bg-contrast 
			"
			>
				<ChatProvider
					config={{
						setMessages,
						messages,
						roomId,
						user,
						containerRef,
						isBlocked,
						isSystem,
						deleteMessage,
						setActivePersons,
						setChatBotTopic,
						ChatBotTopic,
					}}
				>
					<div
						ref={containerRef}
						className="flex-1 h-full flex flex-col overflow-y-auto py-4 px-1 pb-10 has-scroll-container relative "
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
						<hr className="hr-separator bg-contrast"></hr>

						{isLoadingOldMsg && (
							<div className="flex items-center justify-center w-full py-2">
								<span>Loading</span>
								<div className="inline-flex flex-shrink-0 items-center gap-1.5 px-2 py-0.5 rounded-full text-lg text-text">
									<span className="typing-dot wave-strong size-3 rounded-full bg-text" />
									<span className="typing-dot wave-strong size-3 rounded-full bg-text" />
									<span className="typing-dot wave-strong size-3 rounded-full bg-text" />
								</div>
							</div>
						)}
						<div ref={observerRef} className="h-10 absolute top-25 left-0 right-0"></div>

						{initialLoading ? (
							<Loading className="!w-full !flex-1"></Loading>
						) : (
							<>
								<ChatMessages messages={messages} />
							</>
						)}
					</div>

					<ChatInputBox
						initialLoading={initialLoading}
						isBlocked={isBlocked}
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
import ChatInputBox, { preloadQnAModel } from "./components/ChatInputBox";
import { Avatar } from "../general/Avatar";
import { clsx } from "clsx";
import Link from "next/link";
import { examplePassages, isServerRoom } from "@/app/lib/utilities";
import ChatProvider from "./ChatBoxWrapper";
import Loading from "@/app/(root)/chat/[room_id]/loading";
import { useToast } from "@/app/lib/hooks/useToast";
import { DirectMessageCard } from "./components/ChatHeaderForDM";
import { ServerCardHeader } from "./components/ChatHeaderForServer";
import useOnScreen from "@/app/lib/hooks/useOnScreen";

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
