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
import React, { useEffect, useState } from "react";
import { socket } from "@/app/lib/socket";
import { CgProfile } from "react-icons/cg";
import { FaUserFriends } from "react-icons/fa";
import { FaRegNewspaper, FaPlus } from "react-icons/fa6";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { blockFriendship, deleteDM, getChats, getUser, removeFriendshipRequest } from "@/app/lib/actions";
import { usePathname, useRouter } from "next/navigation";
import { Route } from "next";
import { useFriendsProvider } from "@/app/lib/friendsContext";
import { useToast } from "@/app/lib/hooks/useToast";
import { useRouterWithProgress } from "@/app/lib/hooks/useRouterWithProgressBar";
import { supabase } from "@/app/lib/supabase";
import { getDMRoom } from "@/app/lib/utilities";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

export const ChatPreviewContainer = ({ user, chats }: { user: User; chats: ChatType[] }) => {
	const { friends: localChats, setFriends: setLocalChats } = useFriendsProvider();
	const [selectedChat, setSelectedChat] = useState<ChatType | null>(null); // store clicked chat

	useEffect(() => {
		setLocalChats(chats);
	}, [chats]);

	useEffect(() => {
		// socket.emit("join", user.id);
		// async function refetchContacts() {
		// 	const newContacts = await getChats(user.id);
		// 	setLocalChats(newContacts);
		// }
		// socket.on(`refresh-contacts-page`, refetchContacts);
		// return () => {
		// 	socket.off(`refresh-contacts-page`, refetchContacts);
		// 	socket.disconnect();
		// };
	}, []);

	useEffect(() => {
		const channel = supabase.channel(`chats:${user.id}`);

		// A. Postgres Changes
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "friends",
				filter: `user1_id=eq.${user.id}| user2_id=eq.${user.id}`,
			},
			async (payload) => {
				if (payload.eventType === "UPDATE") {
					const data = payload.new;
					const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;
					const recipient = await getUser(recipient_id);
					if (!recipient) return;

					if (data.status === "accepted") {
						const { bio, readme, password, createdAt, ...rest } = recipient;
						setLocalChats((prev) => [...prev, { ...rest, room_id: getDMRoom(user.id, recipient.id) }]);
					}
				}
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
		setLocalChats((prev) => prev.filter((chat) => chat.id !== selectedChat.id));

		try {
			const result = await deleteDM({ id: selectedChat.id, username: selectedChat.username });
			if (!result.success) {
				setLocalChats(previousChats);
				console.error(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
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
											socket.emit("refresh-contacts-page", user.id, selectedChat.id);
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
	return (
		<Link className="cursor-pointer no-underline group/parent" href={`/chat/${chat.room_id}`}>
			<div
				className={clsx(
					"rounded-lg py-1.5 px-2.5  flex items-center gap-2.5 group max-lg:[#sidebar.active_&]:mb-1.5",
					isSelected ? "bg-accent/50 hover:bg-accent/20" : "hover:bg-accent/25"
				)}
			>
				<Avatar
					disableTooltip={true}
					statusIndicator={false}
					id={chat.id}
					src={chat.image}
					size="size-8.5"
					displayName={chat.displayName}
				/>

				<div className="text-sm font-medium text-text truncate">{chat.displayName}</div>

				<DropdownMenu.Trigger asChild>
					<HiDotsVertical
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							selectChat();
						}}
						data-tooltip-id="chat-panel-item-tooltip"
						data-tooltip-content={"More"}
						className={clsx(
							"text-muted group-hover/icon:text-text hover:text-text ml-auto group-hover:opacity-100 opacity-0 text-xl",
							selectedChat && "opacity-100 text-text"
						)}
					/>
				</DropdownMenu.Trigger>
			</div>
		</Link>
	);
};

const headerButtons = [
	{ id: 0, icon: FaUserFriends, label: "Friends", href: "/" },
	{ id: 1, icon: CgProfile, label: "My Profile", href: "/dashboard" },
	{ id: 2, icon: FaRegNewspaper, label: "News Feed", href: "/news" },
];

export const ChatPanelHeader = () => {
	const router = useRouterWithProgress();
	const pathname = usePathname();
	return (
		<>
			<div className="flex flex-col gap-0.5">
				{headerButtons.map(({ id, icon, label, href }) => {
					const Icon = icon;
					return (
						<Link
							key={id}
							href={href as Route}
							className={clsx(
								"btn btn-secondary w-full text-base py-1.5 px-4 pl-3 text-left btn-with-icon no-underline",
								pathname === href
									? "bg-accent/85 text-text hover:bg-surface cursor-default"
									: "bg-transparent hover:bg-accent/25 not-dark:hover:bg-accent/50 text-muted hover:text-text"
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
				<FaPlus
					data-tooltip-id="dm-icon-tooltip"
					data-tooltip-content="Create DM (aesthic only)"
					className="hover:text-text text-muted ml-auto text-sm"
				/>
				<Tooltip id="dm-icon-tooltip" className="my-tooltip" border="var(--tooltip-border)" place="bottom-start" />
			</Link>
		</>
	);
};
