"use client";
import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../lib/socket";
import { ChatType, MessageType, Room, User } from "../../lib/definitions";
import { blockFriendship, deleteMsg, deleteServer, editProfile, editServer, getRecentMessages, getServersInCommon, removeFriendshipRequest } from "../../lib/actions";
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { FaCheck, FaEnvelope, FaIdBadge, FaUser } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import * as Dialog from '@radix-ui/react-dialog';

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

type ChatboxProps = { recipient?: User | Room; user: User; roomId: string, type: "dm" | "server" };

export function Chatbox({ recipient, user, roomId, type }: ChatboxProps) {
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [activePersons, setActivePersons] = useState<string[]>([]);
	const tempIdsRef = useRef<Set<string>>(new Set());
	const [initialLoading, setInitialLoading] = useState(true)
	
	const firstRunRef = useRef(true);

	// fetching msgs at startup and add listeners for typing event
	useEffect(() => {
		if (!firstRunRef.current) return; // firstRunRef purpose: to solve some msgs appearing twice sometimes on first render i guess

		const fetchMessages = async () => {
			const recent = await getRecentMessages(roomId);
			setMessages((prev) => [...prev, ...recent]);
			setInitialLoading(false)
		};

		fetchMessages();

		const handleTypingStart = (displayName: string) => {
			setActivePersons(prev => [...prev, displayName]);
		};

		const handleTypingStop = () => setActivePersons([]);

		socket.on("typing started", handleTypingStart);
		socket.on("typing stopped", handleTypingStop);



		firstRunRef.current = false;

		return () => {
			socket.off("typing started", handleTypingStart);
			socket.off("typing stopped", handleTypingStop);
		};
	}, []);

	// handle incoming msg sockets from server / handle msg delete sockets
	useEffect(() => {
		const handleIncomingMsg = (msg: MessageType) => {
			setMessages((prev) => {
				if (msg.sender_id !== user.id) return [...prev, msg];

				const index = prev.findIndex((item) => item.local && tempIdsRef.current.has(item.createdAt));
				if (index === -1) return [...prev, msg];

				const updated = [...prev];
				updated[index] = { ...msg };

				return updated;
			});
			tempIdsRef.current = new Set();
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
				updated[index] = { ...updated[index], content };
				return updated;
			});
		};

		const toggleReaction = async (id: string, userId: string, emoji: string, operation: "add" | "remove") => {
			setMessages((prev) => {
				const index = prev.findIndex((tx) => tx.id === id);
				if (index === -1) return prev;
				
				const newMsg = [...prev]
				const currentReactors = new Set(newMsg[index].reactions?.[emoji] || [])
				
				if (operation === "remove") {
					currentReactors.delete(userId)
				} else {
					currentReactors.add(userId)
				}
	
				newMsg[index] = {
					...newMsg[index],
					reactions: {
						...newMsg[index].reactions,
						[emoji]: [...currentReactors ],
					},
				};
				return newMsg;
			})
		}

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
	}, [roomId]);

	
	const handleFileUpload = (url: string[], type: "image" | "video") => {
		socket.emit("message", {
			room_id: roomId,
			sender_id: user.id,
			sender_image: user.image ?? null,
			sender_display_name: user.displayName,
			content: JSON.stringify(url), // turn to json string as database schema only accepts STRING,
			type: type,
		});
	};

	const deleteMessage = async (id: string) => {
		const originalMsg = [...messages]
		setMessages((prev) => prev.filter((tx) => tx.id != id));
		const result = await deleteMsg(id, roomId)
		if (!result.success) {
			setMessages(originalMsg)
		}
	};

	const containerRef = useRef<HTMLDivElement>(null);

	
	return (
		<>
			<div
				className="flex flex-1 flex-col shadow-md bg-chatbox		
			"
			>
				<ChatProvider config={{ setMessages, messages, roomId, user, containerRef }}>
					<div ref={containerRef} className="flex-1 flex flex-col overflow-y-auto py-4 pb-10 ">
						{type === "dm" && recipient && <DirectMessageCard roomId={roomId} currentUserId={user.id} user={recipient as User} />}

						{type === "server" && isServerRoom(roomId) && recipient && <ServerCardHeader user={user} server={recipient as Room} />}

						{initialLoading ? (
							<Loading className="!w-full !flex-1"></Loading>
						) : (
							<ChatMessages messages={messages} deleteMessage={deleteMessage} />
						)}
					</div>

					<ChatInputBox
						tempIdsRef={tempIdsRef}
						setMessages={setMessages}
						roomId={roomId}
						user={user}
						activePersons={activePersons}
						handleFileUpload={handleFileUpload}
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
import useDebounce from "@/app/lib/hooks/useDebounce";
import { Avatar } from "../general/Avatar";

function DirectMessageCard({ roomId, currentUserId, user }: { roomId: string, currentUserId: string; user: User }) {
	const [clipboard, setClipboard] = useState("");
	const [commonServers, setCommonServers] = useState<Room[]>([]);
	const [isPending, setIsPending] = useState(true);

	const handleCopy = (string: string) => {
		window.navigator.clipboard.writeText(string);
		setClipboard(string);
	};

	useEffect(() => {
		if (roomId.startsWith("system-room")) return

		const fetchCommonServers = async () => {
			setIsPending(true);
			try {
				const servers = await getServersInCommon(currentUserId, user.id); 
				setCommonServers(servers);
			} catch (err) {
				console.error(err);
				setCommonServers([]);
			} finally {
				setIsPending(false);
			}
		};

		fetchCommonServers();
	}, [user.id]);
	

	return (
		<div className="bg-chatbox text-white p-6 pb-2 rounded-lg max-w-full">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
					{/* <div className="w-12 h-12 rounded-full bg-[#5865f2] flex items-center justify-center text-2xl">
						<FaDiscord />
					</div> */}
					<Avatar size={"size-12"} displayName={user.username} src={user.image} statusIndicator={false}></Avatar>
					<div>
						<h2 className="text-xl font-semibold">{user.displayName}</h2>
						<div role="contentinfo" className="text-sm text-gray-400 cursor-pointer" data-tooltip-id={user.username}>
							@<span onClick={() => handleCopy(user.username)}>{user.username}</span>
							<Tooltip className="my-tooltip" id={user.username} place="right" border={`var(--tooltip-border)`}>
								<span className="flex items-center gap-1">
									{clipboard === user.username ? (
										<>
											<FaCheck className="text-green-500" />
											Copied: {user.username}
										</>
									) : (
										<>Copy: {user.username}</>
									)}
								</span>
							</Tooltip>
						</div>
					</div>
				</div>
			</div>
			<div className="text-gray-400 text-sm mb-4">
				This is the beginning of your direct message history with{" "}
				{roomId.startsWith("system-room") && <span className="text-text font-medium">Our AI Chatbot</span>}
				{!roomId.startsWith("system-room") && <span className="text-text font-medium">{user.username}</span>}.
			</div>
			<div className="flex items-center gap-2">
				<button className="btn btn-secondary" onClick={() => blockFriendship(currentUserId, user.id)}>Block</button>
				<button className="btn btn-secondary" onClick={() => removeFriendshipRequest({username: user.username, id: user.id})}>Unfriend</button>
			</div>

			{!roomId.startsWith("system-room") &&
				(isPending ? (
					<p className="text-xs text-gray-500 mt-2">Loading servers in common...</p>
				) : (
					<ServerList servers={commonServers} />
				))}
		</div>
	);
}


function ServerCardHeader({ server, user }: { server: Room, user: User}) {
	const [clipboard, setClipboard] = useState("");
	const [localServer, setLocalServer] = useState(() => server)

	const handleCopy = (string: string) => {
		window.navigator.clipboard.writeText(string);
		setClipboard(string);
	};

	return (
		<div className="bg-chatbox text-white p-6 pb-2 rounded-lg max-w-md w-full flex flex-col gap-3">
			<div className="flex items-center gap-3">
				{/* Server Icon */}
				<Avatar size="size-14" displayName={localServer.name} src={localServer.profile ?? ""} statusIndicator={false} />
				<div className="flex-1 flex flex-col">
					{/* Server Name */}
					<h2 className="text-xl font-semibold">{localServer.name ?? "No name"}</h2>

					{/* Copy server name */}
					<div
						className="w-fit text-xs text-gray-400 cursor-pointer mt-0.5"
						data-tooltip-id={`server-${localServer.id}`}
					>
						<span onClick={() => handleCopy(localServer.name || "")}>{localServer.name}</span>
						<Tooltip
							className="my-tooltip"
							id={`server-${localServer.id}`}
							place="right"
							border="var(--tooltip-border)"
						>
							<span className="flex items-center gap-1">
								{clipboard === localServer.name ? (
									<>
										<FaCheck className="text-green-500" />
										Copied: {localServer.name}
									</>
								) : (
									<>Copy: {localServer.name}</>
								)}
							</span>
						</Tooltip>
					</div>
				</div>
			</div>

			{/* Server Description */}
			<p className="text-sm text-gray-400 truncate">{localServer.description || "No description available"}</p>

			{/* Server Stats */}
			<div className="flex items-center gap-4 text-gray-400 text-sm">
				<div className="flex items-center gap-1">
					<div className="size-2 bg-emerald-500 rounded-full" />
					<p>{localServer.online_members?.toLocaleString() ?? 0} Online</p>
				</div>
				<div className="flex items-center gap-1">
					<div className="size-2 bg-gray-400 rounded-full" />
					<p>{localServer.total_members?.toLocaleString() ?? 0} Members</p>
				</div>
			</div>

			{localServer.owner_id === user.id && (
				<ServerEditForm setLocalServer={setLocalServer} server={server} user={user} />
			)}
		</div>
	);
}

type EditServerState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
	server: Room | null;
};

function ServerEditForm({server, user, setLocalServer}: {server: Room, user:User, setLocalServer: React.Dispatch<React.SetStateAction<Room>>}) {

			const [uploaded, setUploaded] = useState<string>(server.profile ?? "");
			const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [publicImgUrl] = useState<string>(server.profile ?? "");
	useEffect(() => {
		if (selectedFile) {
		console.log(selectedFile)
	}}, [selectedFile])
		const [{ errors, message, success }, setData] = useState<EditServerState>({
			errors: {},
			message: "",
			success: false,
			server: null,
		});
		const [isPending, setIsPending] = useState(false);
			const router = useRouter();
	
		async function handleSubmit(e: React.FormEvent) {
			e.preventDefault();
			setIsPending(true);
			const formData = new FormData(e.target as HTMLFormElement);
			const url = await uploadAndGetURL();
			console.log("server_image: CHATBOX: ", url)
			formData.set("server_image", url);
			const result = await editServer(formData, server, user.id);
			setData(result);
			if (result.server) setLocalServer((prev) => ({ ...prev, ...result.server }));
			setIsPending(false);
			router.refresh();
	}	
	
	async function uploadAndGetURL(): Promise<string> {
		console.log("uploadAndGetURL called");
		console.log("selectedFile:", selectedFile);
		console.log("publicImgUrl:", publicImgUrl);

		if (selectedFile === null) {
			console.log("No selected file, returning publicImgUrl:", publicImgUrl);
			return publicImgUrl;
		}

		try {
			const options = {
				maxSizeMB: 0.2,
				maxWidthOrHeight: 256,
				useWebWorker: true,
			};

			const compressedFile = await imageCompression(selectedFile, options);
			const filename = `${nanoid()}.${compressedFile.name}`;
			const { data, error } = await supabase.storage.from("uploads").upload(filename, compressedFile);
			if (error) throw error;

			const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(data?.path || "");

			if (publicData?.publicUrl) {
				return publicData.publicUrl;
			}

			console.log("No public URL, resetting uploaded");
			setUploaded("");
			return "";
		} catch (err) {
			console.error("Upload error caught:", err);
			return "";
		}
	}
	

	return (
		<div className="flex items-center gap-1 text-gray-400 text-sm">
			<IconWithSVG
				onClick={() => {
					const isConfirmed = window.confirm("Are you sure you want to delete this server?");
					if (isConfirmed) deleteServer(server.id);
				}}
				className="icon-small"
			>
				<RiDeleteBin5Line />
			</IconWithSVG>

			<Dialog.Root>
				<Dialog.Trigger asChild>
					<IconWithSVG className="icon-small">
						<FiEdit />
					</IconWithSVG>
				</Dialog.Trigger>

				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black/50" />
					<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-md shadow-lg border border-border">
						<Dialog.Title className="text-xl font-semibold text-text mb-4">Edit Server</Dialog.Title>

						{/* Server Edit Form */}
						<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
							{/* Server Icon / Profile Image */}
							<ServerImageUploadBtn
								uploaded={uploaded}
								setUploaded={setUploaded}
								setSelectedFile={setSelectedFile}
								publicImgUrl={publicImgUrl}
							/>

							{/* Server Name */}
							<InputField
								label="Server Name"
								name="name"
								defaultValue={server.name}
								placeholder="Enter server name"
								errors={errors?.name}
							/>

							{/* Server Description */}
							<InputField
								label="Server Description"
								name="description"
								defaultValue={server.description || ""}
								placeholder="Enter a short description (optional)"
								errors={errors?.description}
							/>

							{/* Server Type / Visibility */}
							<div className="flex flex-col gap-1">
								<span className="text-muted text-sm">Server Type</span>
								<select
									name="type"
									defaultValue={server.type}
									className="form-select

									!w-full
									!flex
									!items-center
									!relative
									!px-3
									!min-h-[45px]
									!outline-none
									!rounded-lg
									!border
									!border-border
									!bg-background
									!text-text
									!placeholder-muted
									!transition
									!text-base
									!focus-within:!border-primary

								"
								>
									<option value="private">Private (invite-only)</option>
									<option value="public">Public (anyone can join)</option>
								</select>
								{errors?.type && <span className="text-error text-xs">{errors.type}</span>}
							</div>

							{message && (
								<span className={clsx("text-sm", success ? "text-success" : "text-error")}>{message}</span>
							)}

							{/* Action Buttons */}
							<div className="flex justify-end gap-2 mt-2">
								<Dialog.Close asChild>
									<Button className="btn-secondary">Cancel</Button>
								</Dialog.Close>
								<Button
									disabled={isPending}
									className="btn-purple btn-with-icon justify-center items-center gap-2"
									type="submit"
								>
									{isPending ? "Saving..." : "Save Changes"}
									{isPending && <ImSpinner9 className="animate-spin" />}
								</Button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}




import { nanoid } from "nanoid";
import { clsx } from "clsx";
import Link from "next/link";
import { isServerRoom } from "@/app/lib/utilities";
import { time } from "console";
import ChatBoxWrapper, { ChatProvider } from "./ChatBoxWrapper";
import { init } from "next/dist/compiled/webpack/webpack";
import Loading from "@/app/(root)/chat/[room_id]/loading";
import { Button, IconWithSVG } from "../general/Buttons";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { ImSpinner9 } from "react-icons/im";
import InputField from "../form/InputField";
import { ServerImageUploadBtn } from "./components/UploadButtons";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import imageCompression from "browser-image-compression";

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
