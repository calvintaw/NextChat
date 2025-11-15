"use client";

import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import { ChatType, User } from "../../../lib/definitions";
import Link from "next/link";
import { Avatar } from "../../general/Avatar";
import { HiDotsVertical } from "react-icons/hi";
import { Tooltip } from "react-tooltip";
import React, { useActionState, useEffect, useState } from "react";
import { socket } from "@/app/lib/socket";
import { CgProfile } from "react-icons/cg";
import { FaUserFriends, FaUserPlus } from "react-icons/fa";
import { FaRegNewspaper, FaPlus } from "react-icons/fa6";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import {
	blockFriendship,
	createDM,
	deleteDM,
	getUser,
	getUserByUsername,
	removeFriendshipRequest,
} from "@/app/lib/actions";
import { usePathname, useRouter } from "next/navigation";
import { Route } from "next";
import { useFriendsProvider } from "@/app/lib/contexts/friendsContext";
import { useToast } from "@/app/lib/hooks/useToast";
import { useRouterWithProgress } from "@/app/lib/hooks/useRouterWithProgressBar";
import { supabase } from "@/app/lib/supabase";
import { getDMRoom } from "@/app/lib/utilities";
import { status } from "nprogress";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

export const ChatPreviewContainer = ({ user, chats }: { user: User; chats: ChatType[] }) => {
	const { friends: localChats, setFriends: setLocalChats } = useFriendsProvider();
	const [selectedChat, setSelectedChat] = useState<ChatType | null>(null); // store clicked chat
	const path = usePathname();

	useEffect(() => {
		setLocalChats(chats);
	}, [chats]);

	useEffect(() => {
		const channel = supabase.channel(`chats:${user.id}`);
		//@ts-ignore
		const handler = async (payload) => {
			const data = payload.new;
			const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;
			const recipient = await getUser(recipient_id);
			if (!recipient) return;

			if (data.status === "accepted") {
				const { bio, readme, password, createdAt, ...rest } = recipient;
				setLocalChats((prev) => [
					...prev,
					{
						...rest,
						room_id: getDMRoom(user.id, recipient.id),
						room_image: "",
						room_name: "",
						room_type: "dm",
					},
				]);
			}
		};

		// A. Postgres Changes
		channel
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "friends",
					filter: `user1_id=eq.${user.id}`,
				},
				handler
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "friends",
					filter: `user2_id=eq.${user.id}`,
				},
				handler
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "room_members",
					filter: `user_id=eq.${user.id}`,
				},
				async (payload) => {
					const data = payload.old;
					if (path.includes(data.room_id)) router.push("/");
					setLocalChats((prev) => prev.filter((chat) => chat.room_id !== data.room_id));
				}
			);

		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") console.log(`Subscribed to chats-${user.username}`);
		});

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const toast = useToast();

	const handleDMdelete = async () => {
		if (!selectedChat) return;

		const previousChats = [...localChats];
		// local ui instant updates
		setLocalChats((prev) => prev.filter((chat) => chat.room_id !== selectedChat.room_id));

		try {
			const result = await deleteDM({ id: selectedChat.id, username: selectedChat.username });
			if (!result.success) {
				setLocalChats(previousChats);
				console.error(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
				if (path.includes("system-room") || path.includes(getDMRoom(selectedChat.id, user.id))) {
					router.push("/");
				}
				toast({
					title: "Success!",
					mode: "positive",
					subtitle: `DM with ${selectedChat.username} deleted successfully.`,
				});
			}
		} catch (error) {
			setLocalChats(previousChats);
			console.error("Failed to delete DM:", error);
			toast({ title: "Error!", mode: "negative", subtitle: "Failed to delete DM. Please try again." });
		}
	};

	const pathname = usePathname();
	const router = useRouterWithProgress();

	return (
		<>
			<DropdownMenu.Root
				modal={false}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedChat(null);
					}
				}}
			>
				{localChats.length >= 1 &&
					localChats.map((chat) => (
						<ChatPreview
							isSelected={pathname.includes(chat.room_id)}
							selectedChat={selectedChat?.id === chat.id}
							key={chat.room_id}
							chat={chat}
							selectChat={() => setSelectedChat(chat)}
						/>
					))}

				{localChats.length < 1 && (
					<div className="fade-container px-1">
						{Array.from({ length: 7 }, (_, i) => (
							<div key={i} className="min-h-10 rounded-lg py-1.5 px-1 flex items-center gap-2 group">
								<div className="rounded-full size-8.5 bg-surface/75 flex-shrink-0"></div>
								<div className="rounded-full w-full max-w-[65%] bg-surface/75 flex-1 min-h-6"></div>
							</div>
						))}
					</div>
				)}

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						loop
						sideOffset={8}
						side="right"
						collisionPadding={20}
						className="DropdownMenu__Content"
					>
						{selectedChat && (
							<>
								<DropdownMenu.Item
									className="DropdownMenuItem"
									onClick={(e) => {
										handleDMdelete();
									}}
								>
									Delete DM
								</DropdownMenu.Item>

								<DropdownMenu.Separator className="DropdownMenu__Separator" />

								<DropdownMenu.Item
									className="DropdownMenuItem"
									onClick={async (e) => {
										e.preventDefault();
										const result = await removeFriendshipRequest(selectedChat, "friend");

										if (result.success) {
											router.refresh();
											// socket.emit("refresh-contacts-page", user.id, selectedChat.id);
											toast({
												title: "",
												mode: "positive",
												subtitle: `Friend request with ${selectedChat.username} removed successfully.`,
											});
										} else {
											toast({
												title: "",
												mode: "negative",
												subtitle: result.message || "Failed to remove friend request. Please try again.",
											});
										}
									}}
								>
									Remove Friend

								</DropdownMenu.Item>

								<DropdownMenu.Item
									onClick={(e) => {
										e.preventDefault();
										blockFriendship(user.id, selectedChat.id);
									}}
									className="DropdownMenuItem text-error"
								>
									Block
								</DropdownMenu.Item>
							</>
						)}
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			{/* <Tooltip
				className="my-tooltip"
				border={"var(--tooltip-border)"}
				id="chat-panel-item-tooltip"
				place="left"
				delayShow={100}
			/> */}
		</>
	);
};

export const ChatPreview = ({
	isSelected,
	chat,
	selectChat,
	selectedChat,
}: {
	isSelected: boolean;
	selectedChat: boolean;
	chat: ChatType;
	selectChat: () => void;
}) => {
	if (chat.room_type !== "dm") return null;
	// there is some redundant code below about room type !== dm but I got lazy to remove them.

	return (
		<Link
			className="cursor-pointer no-underline group/parent"
			href={chat.room_type === "dm" ? `/chat/${chat.room_id}` : `/chat/server/${chat.room_id}`}
		>
			<div
				className={clsx(
					"rounded-lg py-2 px-2.5 -mb-0.5 flex items-center gap-2.5 group max-lg:[#sidebar.active_&]:mb-1.5",
					isSelected ? "bg-accent/50 hover:bg-accent/20" : "hover:bg-accent/25 bg-accent/2"
				)}
			>
				<Avatar
					disableTooltip={true}
					statusIndicator={false}
					id={chat.room_type === "dm" ? chat.id : chat.room_id}
					src={chat.room_type === "dm" ? chat.image : chat.room_image}
					size="size-8"
					displayName={chat.room_type === "dm" ? chat.displayName : chat.room_name}
				/>

				<div className="text-sm font-medium text-text truncate">
					{chat.room_type === "dm" ? chat.displayName : chat.room_name}
				</div>

				{chat.room_type === "dm" && (
					<DropdownMenu.Trigger asChild>
						<HiDotsVertical
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								selectChat();
							}}
							data-no-progress
							data-id="no-progress-bar"
							data-tooltip-id="chat-panel-item-tooltip"
							data-tooltip-content={"More"}
							className={clsx(
								"text-muted group-hover/icon:text-text hover:text-text ml-auto group-hover:opacity-100 opacity-0 text-xl",
								selectedChat && "opacity-100 text-text"
							)}
						/>
					</DropdownMenu.Trigger>
				)}
			</div>
		</Link>
	);
};

const headerButtons = [
	{ id: 0, icon: FaUserFriends, label: "Friends", href: "/" },
	{ id: 1, icon: CgProfile, label: "My Profile", href: "/dashboard" },
	// { id: 2, icon: FaPlus, label: "New Chat", href: "/" },
	{ id: 2, icon: FaRegNewspaper, label: "News Feed", href: "/news?q=home" }, // removed bc it was just a pet mini project within this one.
];

export const ChatPanelHeader = ({ user }: { user: User }) => {
	const router = useRouterWithProgress();
	const pathname = usePathname();
	return (
		<>
			<div className="flex flex-col gap-0.75">
				{headerButtons.map(({ id, icon, label, href }) => {
					const Icon = icon;
					return (
						<Link
							key={id}
							href={href as Route}
							// className={clsx(
							// 	"btn btn-secondary w-full text-base py-1.5 px-4 pl-3 text-left btn-with-icon no-underline",
							// 	pathname === href
							// 		? "bg-accent/85 text-text hover:bg-surface cursor-default"
							// 		: "bg-transparent hover:bg-accent/25 not-dark:hover:bg-accent/50 text-muted hover:text-text"
							// )}
							className={clsx(
								"btn btn-secondary w-full text-base py-2 px-4 pl-3 text-left btn-with-icon no-underline rounded-md transition-colors duration-200",
								pathname === href
									? "bg-accent/80 text-text cursor-default"
									: "bg-surface/25 not-dark:bg-surface/35 text-muted hover:bg-accent/30 not-dark:hover:bg-accent/50 hover:text-text"
							)}
							onClick={() => router.push(href as Route)}
						>
							<Icon className="text-xl" />
							{label}
						</Link>
					);
				})}
			</div>

			<hr className="hr-separator my-2" />

			<Link
				href="/"
				className="no-underline btn btn-secondary w-full text-sm !p-0 !px-2 !bg-transparent group text-left btn-with-icon"
			>
				<span className="group-hover:text-text text-muted max-lg:[#sidebar.active_&]:mb-1.5 max-lg:[#sidebar.active_&]:mt-1">
					Direct Messages
				</span>

				<CreateDMButton currentUser={user}></CreateDMButton>

				<Tooltip id="dm-icon-tooltip" className="my-tooltip" border="var(--tooltip-border)" place="bottom-start" />
			</Link>
		</>
	);
};

import * as Dialog from "@radix-ui/react-dialog";
import { IoSearch } from "react-icons/io5";
import InputField from "../../form/InputField";
import { IconWithSVG } from "../../general/Buttons";
import { BiLoaderAlt } from "react-icons/bi";

// const CreateDMButton = () => {
// 	const [isPending, setIsPending]
// 	const [error, seterror];

// 	const [user, setUser] = useState<User>([])

// 	return (
// 		<>
// 			<Dialog.Root>
// 				<Dialog.Trigger asChild>
// 					<FaPlus
// 						data-tooltip-id="dm-icon-tooltip"
// 						data-tooltip-content="Create DM"
// 						className="hover:text-text text-muted ml-auto text-sm"
// 					/>
// 				</Dialog.Trigger>

// 				<Dialog.Portal>
// 					<Dialog.Overlay className="fixed inset-0 bg-black/50" />
// 					<Dialog.Content
// 						className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 pt-4 w-full max-w-md shadow-lg border border-border
// 			z-[12000]							"
// 					>
// 						<Dialog.Title className="text-xl font-semibold text-text mb-4">Create a new DM</Dialog.Title>

// 						<form onSubmit={(formdata) => {
// 							const user = await getUserByUsername(formdata.q)
// 							setUser(user)
// 						}} className="w-full md:ml-auto">
// 							<InputField
// 								name="q"
// 								type="text"
// 								placeholder="Enter username"
// 								disabled={isPending}
// 								place="right"
// 								className="w-full flex-1"
// 								parentClassName="w-full min-h-0 h-10 px-1.5 "

// 								icon={
// 									<IconWithSVG type="submit" className="icon-small">
// 										{isPending ? <BiLoaderAlt className="animate-spin text-lg" /> : <IoSearch />}
// 									</IconWithSVG>
// 								}
// 							/>
// 						</form>

// 						{user && (

// 								)}

// 						{error && <p className="text-red-500 mt-2">{error}</p>}
// 					</Dialog.Content>
// 				</Dialog.Portal>
// 			</Dialog.Root>
// 		</>
// 	);
// };

// const usercard = ({user}) => {
// 	return (
// 		<div className="rounded-lg h-15 px-2.5 hover:bg-accent/25 flex items-start gap-2.5">
// 						{/* Avatar */}
// 						<div className="h-full flex flex-row py-2.5">
// 							<Avatar
// 								disableTooltip={true}
// 								id={user.id}
// 								src={user.image}
// 								size="size-8.5"
// 								displayName={user.displayName}
// 								statusIndicator={true}
// 								status={user.username === "system" ? true : user.online}
// 							/>
// 						</div>

// 						{/* user name + status */}
// 						<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
// 							{user.displayName}
// 							{user.username}
// 						</div>

// 						<button>Create DM</button>
// 					</div>
// 	)
// }

export const CreateDMButton = ({ currentUser }: { currentUser: User }) => {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	const handleSubmit = async (username: string) => {
		// e.preventDefault();
		// const formData = new FormData(e.currentTarget);
		// const username = formData.get("q")?.toString().trim();
		if (username === currentUser.username) {
			setError("Invalid DM");
			return;
		}

		if (!username) {
			setError("Username is required");
			return;
		}

		setIsPending(true);
		setError(null);

		try {
			const normalizedUsername = username.startsWith("@") ? username.slice(1) : username;
			const fetchedUser = await getUserByUsername(normalizedUsername);
			if (!fetchedUser) {
				setError("User not found");
			} else {
				setUser(fetchedUser);
			}
		} catch (err) {
			setError("An error occurred");
		} finally {
			setIsPending(false);
		}
	};

	const [username, setUsername] = useState("");

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<FaPlus
					data-tooltip-id="dm-icon-tooltip"
					data-tooltip-content="Create DM"
					className="hover:text-text text-muted ml-auto text-sm"
				/>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 pt-4 w-full max-w-md shadow-lg border border-border z-[12000]">
					<Dialog.Title className="text-xl font-semibold text-text mb-4">Create a new DM</Dialog.Title>

					<div className="w-full md:ml-auto mb-4">
						<InputField
							name="q"
							type="text"
							placeholder="Enter username"
							disabled={isPending}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit(username);
							}}
							place="right"
							className="w-full flex-1"
							parentClassName="w-full min-h-0 h-10 px-1.5"
							icon={
								<IconWithSVG className="icon-small" onClick={() => handleSubmit(username)}>
									{isPending ? <BiLoaderAlt className="animate-spin text-lg" /> : <IoSearch />}
								</IconWithSVG>
							}
						/>
					</div>

					{(isPending || !user) && <UserCardSkeleton></UserCardSkeleton>}
					{!isPending && user && <UserCard user={user} />}
					{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

const UserCard = ({ user }: { user: User }) => {
	const [isPending, setIsPending] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string }>({ success: false, message: "" });
	return (
		<>
			<div className="rounded-lg h-15 px-2.5  bg-accent/30 flex items-center gap-2.5">
				<div className="h-full flex items-center flex-row py-2.5">
					<Avatar
						disableTooltip={true}
						id={user.id}
						src={user.image}
						size="size-9"
						displayName={user.displayName}
						statusIndicator={false}
					/>
				</div>

				<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
					<p>{user.displayName}</p>
					<p>@{user.username}</p>
				</div>

				<button
					disabled={isPending}
					onClick={async () => {
						setIsPending(true);
						const result = await createDM({ id: user.id, username: user.username });
						setResult({ success: result.success, message: result.message });
						setIsPending(false);
					}}
					className="hover:bg-background/75 btn-with-icon justify-center items-center gap-2"
				>
					Create DM
					{isPending && <BiLoaderAlt className="animate-spin text-lg" />}
				</button>
			</div>
			{result.success && <p className="mt-1 text-sm text-success">{result.message}</p>}
			{!result.success && <p className="mt-1 text-xs text-red-500">{result.message}</p>}
		</>
	);
};

const UserCardSkeleton = () => {
	return (
		<div className="rounded-lg h-15 px-2.5 bg-accent/50 not-dark:bg-foreground/25 flex items-center gap-2.5 animate-pulse">
			{/* Avatar placeholder */}
			<div className="h-full flex items-center flex-row py-2.5">
				<div className="rounded-full bg-background/50 w-9 h-9"></div>
			</div>

			{/* Text placeholder */}
			<div className="flex-1 flex flex-col justify-center gap-1">
				<div className="h-3 w-1/2 bg-background/50 rounded"></div>
				<div className="h-3 w-1/3 bg-background/50 rounded"></div>
			</div>

			{/* Button placeholder */}
			<div className="w-20 h-8 bg-background/50 rounded"></div>
		</div>
	);
};
