"use client";
import React, { useEffect, useRef, useState } from "react";
// REMOVED: import { socket } from "../../lib/socket"; // <-- Removed
import { MessageContentType, MessageType, Room, sql, User } from "../../lib/definitions";
import { checkIfBlocked, deleteMsg, getRecentMessages, getUserProfileForMsg } from "../../lib/actions";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { Tooltip } from "react-tooltip";
import { get as getCache, set as setCache } from "idb-keyval";
import Loading from "@/app/(root)/chat/[room_id]/loading";
import useOnScreen from "@/app/lib/hooks/useOnScreen";
import { useToast } from "@/app/lib/hooks/useToast";
import { isServerRoom } from "@/app/lib/utilities";
import ChatProvider from "./ChatBoxWrapper";
import { DirectMessageCard } from "./components/ChatHeaderForDM";
import { ServerCardHeader } from "./components/ChatHeaderForServer";
import ChatInputBox from "./components/ChatInputBox";
import ChatMessages from "./components/ChatMessages";
import { supabase } from "@/app/lib/supabase"; // <-- Retained/Corrected Import

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

type ChatboxProps = { recipient: User | Room; user: User; roomId: string; type: "dm" | "server" };
const getRoomMessagesKey = (roomId: string) => `chat_messages_${roomId}`;

export function Chatbox({ recipient, user, roomId, type }: ChatboxProps) {
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [activePersons, setActivePersons] = useState<string[]>([]);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isBlocked, setIsBlocked] = useState(false);
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

	useEffect(() => {
		const checkAuth = async () => {
			const { data, error } = await supabase.auth.getSession();
			if (error) {
				console.error("Auth error:", error);
				return;
			}

			if (!data.session) {
				console.warn("⚠️ No active Supabase session. User not authenticated.");
			} else {
				console.log("✅ Authenticated as:", data.session.user.email);
			}
		};

		checkAuth();
	}, []);

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

	// --- 1. Supabase Channel Connection and Realtime Events ---
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) return;

		// 1. Create a channel dedicated to the room ID
		const channel = supabase.channel(`room:${roomId}`);
		console.log("Subscribing to channel:", `room:${roomId}`);

		// A. Postgres Changes (For Message/Edit/Delete)
		channel
			.on(
				"postgres_changes",
				{
					event: "*", // Listen for INSERT, UPDATE, DELETE
					schema: "public",
					table: "messages",
					filter: `room_id=eq.${roomId}`,
				},
				async (payload) => {
					// Ensure we don't process messages sent by the current user (they are already added locally)
					if (payload.new && (payload.new as MessageType).sender_id === user.id) return;

					const dbMsg = payload.new as any; // Supabase returns snake_case
					const userInfo = await getUserInfo(dbMsg.sender_id);

					const msg: MessageType = {
						...dbMsg,
						createdAt: dbMsg.created_at, // map snake_case to camelCase
						sender_image: dbMsg.sender_image ?? userInfo.image,
						sender_display_name: dbMsg.sender_display_name ?? userInfo.display_name,
					};

					if (payload.eventType === "INSERT") {
						// Filter out duplicates (though Supabase should handle this well)
						if (messageIdsRef.current.has(msg.id)) return;
						messageIdsRef.current.add(msg.id);
						setMessages((prev) => [...prev, msg]);
					} else if (payload.eventType === "DELETE") {
						const deletedId = payload.old.id;
						messageIdsRef.current.delete(deletedId);
						setMessages((prev) => prev.filter((tx) => tx.id !== deletedId));
					} else if (payload.eventType === "UPDATE") {
						const dbMsg = payload.new as any;
						setMessages((prev) => {
							const index = prev.findIndex((m) => m.id === dbMsg.id);
							if (index === -1) return prev;

							const updated = [...prev];
							const existingReactions = updated[index].reactions || {};

							// merge reactions from db, overwrite with new counts
							updated[index] = {
								...updated[index],
								...dbMsg,
								reactions: {
									...existingReactions,
									...dbMsg.reactions,
								},
							};
							return updated;
						});
					}
				}
			)
			// B. Broadcast Events (For Typing Indicators and Reactions/Non-DB-updates)
			.on(
				"broadcast",
				{ event: "typing" }, // Matches where you'd emit it in ChatInputBox
				({ payload }) => {
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
				}
			)
			// Reactions are better handled by the UPDATE Postgres Change,
			// but if you prefer a separate broadcast for performance or custom logic:
			/*
			.on(
				'broadcast',
				{ event: 'reaction_toggle' }, 
				({ payload }) => {
					// Logic to toggle reaction locally (toggleReaction function logic)
					// Note: If reactions update the DB, stick to the UPDATE listener above.
				}
			)
			*/
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log(`Successfully subscribed to room ${roomId}`);
				}
			});

		return () => {
			// Cleanup: Remove the channel on component unmount
			supabase.removeChannel(channel);
		};
	}, [roomId, isBlocked, isSystem, user.id]); // Added user.id to dependencies

	// --- 2. Other Core Hooks (Mostly Unchanged) ---

	// initial setup for blocking/system status
	useEffect(() => {
		// ... (unchanged)
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
			setIsSystem(true);
			setInitialLoading(false);
		}
	}, [type, recipient, user.id]);

	const LIMIT = 15;

	// fetching msgs at startup and add listeners for typing event (ONLY FETCHING REMAINS)
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) {
			setInitialLoading(false);
			setHasMore(false);
			return;
		}

		const fetchMessages = async () => {
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
				// Added toast to show error to user
				// toast({ title: "Error!", mode: "negative", subtitle: "Failed to load recent messages. Check connection." });
			} finally {
				setInitialLoading(false); // Ensure loading stops even on failure
			}
		};

		fetchMessages();

		// NOTE: Socket.IO typing listeners are removed here as they are replaced by Supabase Broadcasts in the main realtime useEffect.
		// If you keep them, you'll have duplicate logic.
		return () => {
			// Clean up of original Socket.IO listeners (now removed)
		};
	}, [isBlocked, isSystem, roomId]);

	// NOTE: The original `useEffect` that contained all the `socket.on(...)` handlers
	// is now completely replaced by the first useEffect (Supabase Channel/Postgres Changes).
	// The original effect:
	/*
	useEffect(() => {
		if (isBlocked || (isSystem && isBlocked)) return;
		// ... socket.on("message", handleIncomingMsg);
		// ... socket.on("message deleted", handleMessageDeleted);
		// ... socket.on("message edited", handleMessageEdited);
		// ... socket.on("add_reaction_msg", toggleReaction);
		// ... socket.on("remove_reaction_msg", toggleReaction);
		return () => { // ... socket.off cleanup
		};
	}, [roomId, isBlocked, isSystem]);
	*/

	// NOTE: The original `useEffect` that handled join/leave using socket.emit is replaced
	// by the Supabase channel subscription and removal in the first realtime useEffect.
	/*
	useEffect(() => {
		socket.emit("join", roomId);
		return () => {
			socket.emit("leave", roomId);
		};
	}, [roomId]);
	*/

	const toast = useToast();

	const deleteMessage = async (id: string, type: MessageContentType = "text", content: string) => {
		if (isBlocked || (isSystem && isBlocked)) return;

		const originalMsg = [...messages];

		// local update (Optimistic UI update is still good practice)
		setMessages((prev) => prev.filter((tx) => tx.id != id));

		const result = await deleteMsg(id, type, content);
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		}
		// NOTE: socket.emit("delete message", id, roomId); is REMOVED
		// The deletion in the DB inside deleteMsg() triggers the Supabase
		// "postgres_changes" DELETE event automatically for other clients.

		messageIdsRef.current.delete(id);
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
		// ... (rest of function is unchanged)
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
				className="flex flex-1 h-full min-lg:max-h-[calc(100vh-34px)] !overflow-clip flex-col shadow-md bg-contrast 
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
						{type === "server" && isServerRoom(roomId) && recipient && (
							<ServerCardHeader user={user} server={recipient as Room} />
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

type CachedUser = {
	id: string;
	display_name: string;
	image: string | null;
};

const USER_CACHE_KEY = (userId: string) => `user_${userId}`;

export async function getUserInfo(userId: string) {
	// 1️⃣ Check cache first
	const cached: CachedUser | undefined = await getCache(USER_CACHE_KEY(userId));
	if (cached) return cached;

	// 2️⃣ If not cached, fetch from Supabase
	const result = await getUserProfileForMsg(userId);

	if (!result.success) {
		console.error("Failed to fetch user info:", error);
		return { id: userId, display_name: "Unknown", image: null };
	}

	const userInfo: CachedUser = {
		id: userId,
		display_name: result.displayName ?? "Unknown",
		image: result.image ?? null,
	};

	// 3️⃣ Store in cache for future use
	await setCache(USER_CACHE_KEY(userId), userInfo);

	return userInfo;
}
