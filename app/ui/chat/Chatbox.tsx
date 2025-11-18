"use client";
import React, { useEffect, useRef, useState } from "react";
import { MessageContentType, MessageType, Room, sql, User } from "../../lib/definitions";
import { checkIfBlocked, deleteMsg, getRecentMessages, getUserProfileForMsg, updateImageMSG } from "../../lib/actions";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { Tooltip } from "react-tooltip";
import { get as getCache, set as setCache } from "idb-keyval";
import Loading from "@/app/(root)/chat/[room_id]/loading";
import useOnScreen from "@/app/lib/hooks/useOnScreen";
import { useToast } from "@/app/lib/hooks/useToast";
import ChatProvider from "./ChatBoxWrapper";
import { DirectMessageCard } from "./components/ChatHeader/ChatHeaderForDM";
import { ServerCardHeader } from "./components/ChatHeader/ChatHeaderForServer";
import ChatInputBox, { ChatInputBoxRef } from "./components/ChatInputBox";
import ChatMessages from "./components/ChatMessages";
import { supabase } from "@/app/lib/supabase";
import VideoCallPage from "../video_chat/VideoCallPage";
import { useGeneralProvider } from "@/app/lib/contexts/GeneralContextProvider";
import clsx from "clsx";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

type ChatboxProps = { recipient: User | Room; user: User; roomId: string; type: "dm" | "server" };

export function Chatbox({ recipient, user, roomId, type }: ChatboxProps) {
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [activePersons, setActivePersons] = useState<string[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isBlocked, setIsBlocked] = useState(false);
	const [isSystem, setIsSystem] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const observerRef = useRef<HTMLDivElement>(null);
	const limit = 25;
	const [hasMore, setHasMore] = useState(true);
	const [isLoadingOldMsg, setIsLoadingOldMsg] = useState(false);
	const chatInputBoxRef = useRef<ChatInputBoxRef>(null);
	const toast = useToast();

	// const messageIdsRef = useRef<Set<string>>(new Set());
	const oldestMsgCreatedAt = useRef<string>("");
	const scrollHeightBefore = useRef(0);
	const lastBatchLength = useRef(limit);
	const offsetRef = useRef(0);

	const { isVideoPageOpen, toggleVideoPage } = useGeneralProvider();

	const sortMessagesAsc = (msgs: MessageType[]) =>
		[...msgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

	// --- 1. Supabase Channel Connection and Realtime Events ---
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) return;

		const channel = supabase.channel(`room:${roomId}`);
		// console.log("Subscribing to channel:", `room:${roomId}`);

		// A. Postgres Changes
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "messages",
				filter: `room_id=eq.${roomId}`,
			},
			async (payload) => {
				const dbMsg = payload.new as any;
				const userInfo = await getUserInfo(dbMsg.sender_id);

				const msg: MessageType = {
					...dbMsg,
					createdAt: dbMsg.created_at, // map snake_case to camelCase
					sender_image: dbMsg.sender_image ?? userInfo.image,
					sender_display_name: dbMsg.sender_display_name ?? userInfo.display_name,
				};

				if (payload.eventType === "INSERT") {
					// if (!messageIdsRef.current.has(msg.id) && msg.sender_id !== user.id) {
					if (msg.sender_id !== user.id) {
						// messageIdsRef.current.add(msg.id);
						setMessages((prev) => [...prev, msg]);
					}
				} else if (payload.eventType === "DELETE") {
					// messageIdsRef.current.delete(payload.old.id);
					setMessages((prev) => prev.filter((tx) => tx.id !== payload.old.id));
				} else if (payload.eventType === "UPDATE") {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === msg.id ? { ...m, ...msg, reactions: JSON.parse(JSON.stringify(msg.reactions)) } : m
						)
					);
				}
			}
		);

		channel.on("broadcast", { event: "typing" }, ({ payload }) => {
			if (payload.status === "started") {
				setActivePersons((prev) => {
					if (!prev.includes(payload.displayName)) {
						return [...prev, payload.displayName];
					}
					return prev;
				});
			} else if (payload.status === "stopped") {
				setActivePersons((prev) => prev.filter((name) => name !== payload.displayName));
			}
		});

		channel.on("broadcast", { event: "link_expired" }, ({ payload }) => {
			setMessages((prev) => prev.map((chat) => (chat.id === payload.id ? { ...chat, link_expired: true } : chat)));
		});

		// B. Broadcast Events
		// channel
		// 	.on("broadcast", { event: "msg_inserted" }, ({ payload }) => {
		// 		const msg = payload.msg;
		// 		if (!messageIdsRef.current.has(msg.id) && msg.sender_id !== user.id) {
		// 			messageIdsRef.current.add(msg.id);
		// 			setMessages((prev) => [...prev, msg]);
		// 		}
		// 	})
		// 	.on("broadcast", { event: "msg_deleted" }, ({ payload }) => {
		// 		messageIdsRef.current.delete(payload.msg_id);
		// 		setMessages((prev) => prev.filter((tx) => tx.id !== payload.msg_id));
		// 	})
		// 	.on("broadcast", { event: "msg_edited" }, ({ payload }) => {
		// 		setMessages((prev) =>
		// 			prev.map((tx) => (tx.id === payload.msg_id ? { ...tx, content: payload.msg_content } : tx))
		// 		);
		// 	})
		// 	.on("broadcast", { event: "reaction_updated" }, ({ payload }) => {
		// 		setMessages((prev) =>
		// 			prev.map((msg) => {
		// 				if (msg.id !== payload.messageId) return msg;
		// 				const currentReactions = { ...msg.reactions };
		// 				const users = new Set(currentReactions[payload.emoji] || []);

		// 				if (payload.type === "added") users.add(payload.userId);
		// 				else if (payload.type === "removed") users.delete(payload.userId);

		// 				currentReactions[payload.emoji] = Array.from(users);
		// 				return { ...msg, reactions: currentReactions };
		// 			})
		// 		);
		// 	});

		// Subscribe to the channel
		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") console.log(`Subscribed to room ${roomId}`);
		});

		return () => {
			resetRefs();
			supabase.removeChannel(channel);
		};
	}, [roomId, isBlocked, isSystem, user.id]);

	function resetRefs() {
		// messageIdsRef.current.clear();
		oldestMsgCreatedAt.current = "";
		scrollHeightBefore.current = 0;
		lastBatchLength.current = limit;
		offsetRef.current = 0;
	}

	useEffect(() => {
		console.log("MESSAGES CHANGE:", messages, {
			// messageIds: messageIdsRef.current,
			oldestMsgCreatedAt: oldestMsgCreatedAt.current,
			scrollHeightBefore: scrollHeightBefore.current,
			lastBatchLength: lastBatchLength.current,
			offset: offsetRef.current,
		});
	}, [messages]);

	useEffect(() => {
		const initialize = async () => {
			resetRefs();

			let blocked = false;
			if (type === "dm" && recipient) blocked = await checkIfBlocked(user, recipient as User);
			setIsBlocked(blocked);

			const system = roomId.startsWith("system-room");
			setIsSystem(system);

			if (blocked) {
				setHasMore(false);
				setInitialLoading(false);
				return;
			}

			try {
				const recent = await getRecentMessages(roomId, { limit });

				if (recent.length > 0) {
					offsetRef.current = recent.length;
					lastBatchLength.current = recent.length;
					oldestMsgCreatedAt.current = recent[recent.length - 1].createdAt;
					setMessages(sortMessagesAsc(recent));
				}
				setHasMore(recent.length === limit);
			} catch (err) {
				console.error("Failed to fetch recent messages:", err);
				toast({ title: "Error!", mode: "negative", subtitle: "Failed to load messages. Please refresh the page." });
				setHasMore(false);
			} finally {
				setInitialLoading(false);
			}
		};

		initialize();

		return () => {
			resetRefs();
		};
	}, [type, recipient, roomId, user.id]);

	const deleteMessage = async (id: string, type: MessageContentType = "text", content: string) => {
		if (isBlocked || (isSystem && isBlocked)) return;

		const originalMsg = [...messages];

		// local update
		setMessages((prev) => prev.filter((tx) => tx.id != id));

		const result = await deleteMsg(id, roomId, type, content);
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		}
		// The deletion in the DB inside deleteMsg() triggers the Supabase
		// "postgres_changes" DELETE event automatically for other clients.

		// messageIdsRef.current.delete(id);
	};

	// ... (fetchOlderMessages, isTopVisible, scroll position effects, caching - all UNCHANGED)
	const fetchOlderMessages = async () => {
		// ... (unchanged)
		if (!hasMore || !containerRef.current || isLoadingOldMsg || initialLoading || lastBatchLength.current < limit)
			return;

		setIsLoadingOldMsg(true);

		const olderMessages = await getRecentMessages(roomId, {
			cursor: oldestMsgCreatedAt.current,
			limit,
		});

		lastBatchLength.current = olderMessages.length;
		offsetRef.current += olderMessages.length;

		if (olderMessages.length < limit) setHasMore(false);
		if (olderMessages.length === 0) {
			setIsLoadingOldMsg(false);
			return;
		}
		oldestMsgCreatedAt.current = olderMessages.length >= 1 ? olderMessages[olderMessages.length - 1].createdAt : "";

		const scrollContainer = containerRef.current;
		scrollHeightBefore.current = scrollContainer.scrollHeight;

		// prepend messages
		setMessages((prev) => {
			const seen = new Set(prev.map((m) => m.id));
			const fresh = olderMessages.filter((m) => !seen.has(m.id));
			return sortMessagesAsc([...fresh, ...prev]);
		});
		setIsLoadingOldMsg(false);
	};

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

	// Function to call child method
	const handleSendMessageFromParent = (input: string, type: MessageContentType = "text") => {
		if (chatInputBoxRef.current) {
			chatInputBoxRef.current.sendMessage(input, type);
		}
	};

	const handleUpdateImageFromParent = async (msg: Pick<MessageType, "content" | "id">) => {
		

		const result = await updateImageMSG({ content: msg.content, id: msg.id });

		if (!result.success) {
			toast({
				title: "Error!",
				mode: "negative",
				subtitle: result.message || "Failed to update the message. Please try again.",
			});
		} else {
			setMessages((prev) => prev.map((item) => (item.id !== msg.id ? item : { ...item, content: msg.content })));
		}
	};

	return (
		<>
			<div
				className={clsx(
					`
					flex flex-1 h-full  !overflow-clip flex-col shadow-md bg-contrast 
					`,
					!isVideoPageOpen && `min-lg:max-h-[calc(100vh-34px)]`, 
					isVideoPageOpen && "max-[820px]:!hidden"
				)}
			>
				<ChatProvider
					config={{
						isLoadingOldMsg,
						setMessages,
						messages,
						roomId,
						user,
						recipient,
						containerRef,
						isBlocked,
						isSystem,
						handleSendMessageFromParent,
						handleUpdateImageFromParent,
						deleteMessage,
						setActivePersons,
					}}
				>
					<div
						ref={containerRef}
						className="flex-1 h-full flex flex-col overflow-y-auto pt-0 py-4 px-1 pb-10 has-scroll-container relative "
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
						{type === "server" && recipient && <ServerCardHeader user={user} server={recipient as Room} />}

						<hr className="hr-separator bg-contrast mt-1"></hr>

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
						ref={chatInputBoxRef}
						isBlocked={isBlocked}
						setMessages={setMessages}
						roomId={roomId}
						user={user}
						activePersons={activePersons}
					/>
				</ChatProvider>
			</div>
			<VideoCallPage roomId={roomId} currentUser={user}></VideoCallPage>
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

type CachedUser = {
	id: string;
	display_name: string;
	image: string | null;
};

const USER_CACHE_KEY = (userId: string) => `user_${userId}`;
export async function getUserInfo(userId: string) {
	// Check cache first
	const cached: CachedUser | undefined = await getCache(USER_CACHE_KEY(userId));
	if (cached) return cached;

	// If not cached, fetch from Supabase
	const result = await getUserProfileForMsg(userId);

	if (!result.success) {
		console.error("Failed to fetch user info:");
		return { id: userId, display_name: "Unknown", image: null };
	}

	const userInfo: CachedUser = {
		id: userId,
		display_name: result.displayName ?? "Unknown",
		image: result.image ?? null,
	};

	// Store in cache for future use
	await setCache(USER_CACHE_KEY(userId), userInfo);

	return userInfo;
}
