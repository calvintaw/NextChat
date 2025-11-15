"use client";
import { createDM, removeFriendshipRequest } from "@/app/lib/actions";
import { ContactType, User } from "@/app/lib/definitions";
import { socket } from "@/app/lib/socket";
import Link from "next/link";
import { useState, useEffect } from "react";
import { IoChatbubble } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { Tooltip } from "react-tooltip";
import { Avatar } from "../general/Avatar";
import { IconWithSVG } from "../general/Buttons";
import { getDMRoom } from "@/app/lib/utilities";
import { useFriendsProvider } from "@/app/lib/contexts/friendsContext";
import { useToast } from "@/app/lib/hooks/useToast";
import clsx from "clsx";

type MinimalUserType = { id: string; username: string };
type Props = {
	user: User;
	contacts: ContactType[];
	setContacts: React.Dispatch<React.SetStateAction<ContactType[]>>;
};

export const ContactPreviewContainer = ({ setContacts, user, contacts }: Props) => {
	// useEffect(() => {
	// 	function handleStatusChange(userId: string, online: boolean) {
	// 		setContacts((prev) => {
	// 			const index = prev.findIndex((person) => person.id === userId);

	// 			if (index === -1) return prev;
	// 			const newContacts = [...prev];
	// 			newContacts[index].online = online;
	// 			return newContacts;
	// 		});
	// 	}

	// 	socket.on("online", handleStatusChange);
	// 	socket.on("offline", handleStatusChange);

	// 	return () => {
	// 		socket.off("online", handleStatusChange);
	// 		socket.off("offline", handleStatusChange);
	// 	};
	// }, []);

	const toast = useToast();
	const [error, setError] = useState("");
	const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

	const handleRemove = async (friend: MinimalUserType, type: "incoming" | "sent" | "friend") => {
		setPendingDeletes((prev) => new Set(prev).add(friend.id));

		try {
			const result = await removeFriendshipRequest(friend, type);
			if (!result.success) {
				setError(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
				// socket.emit("refresh-contacts-page", user.id, friend.id);

				// local update
				setContacts((prev) => prev.filter((req) => req.id !== friend.id));
				toast({ title: "Success!", mode: "positive", subtitle: `Removed @${friend.username} from Contacts` });
				if (friend.username === "system") {
					toast({
						title: "AI ChatBot",
						mode: "info",
						subtitle: "Want to chat again? Use @system to add me as Friend.",
					});
				}
			}
		} catch (err) {
			setError("Failed to remove friend request");
			toast({ title: "Error!", mode: "negative", subtitle: "Failed to remove friend request." });
		} finally {
			setPendingDeletes((prev) => {
				const newSet = new Set(prev);
				newSet.delete(friend.id);
				return newSet;
			});
		}
	};

	return (
		<section className="flex flex-col flex-1">
			{error && <p className="text-sm text-error my-2">{error}</p>}
			{contacts.map((contact) => (
				<ContactCard
					isPending={pendingDeletes.has(contact.id)}
					user={user}
					handleRemove={handleRemove}
					contact={contact}
					key={contact.id}
				/>
			))}
			{contacts.length <= 0 && (
				<div className="flex flex-1 items-center justify-center -mt-15">
					<p className="text-muted max-[700px]:text-center">
						Looks like your friend list is as quiet as space. Time to send some invites! 😆
					</p>
				</div>
			)}
		</section>
	);
};

const ContactCard = ({
	handleRemove,
	user,
	contact,
	isPending,
}: {
	handleRemove: (friend: MinimalUserType, type: "incoming" | "sent" | "friend") => void;
	user: User;
	isPending: boolean;
	contact: ContactType;
}) => {
	const { friends: chats, setFriends: setChats } = useFriendsProvider();
	const room_id = contact.username === "system" ? `system-room-${user.id}` : getDMRoom(user.id, contact.id);

	const handleClick = async () => {
		// Check if DM already exists in state
		const dmExists = chats.some((chat) => chat.id === contact.id && chat.room_type === "dm");
		if (dmExists) {
			console.log("DM already exists. No need to create.");
			return;
		}

		// Create DM if it doesn't exist
		const result = await createDM({ id: contact.id, username: contact.username });

		if (result.success) {
			setChats((prev) => {
				// Check if contact with same id already exists
				const exists = prev.some((c) => c.id === contact.id && c.room_type === "dm");

				if (exists) {
					return prev; // do nothing if already exists
				}

				// Otherwise, add the new contact
				return [
					...prev,
					{
						id: contact.id,
						image: contact.image,
						username: contact.username,
						displayName: contact.displayName,
						email: contact.email,
						online: false,
						room_id,
						room_image: "",
						room_name: "",
						room_type: "dm",
					},
				];
			});
		} else {
			console.error(result.message);
		}
	};

	return (
		<Link className={clsx("group/contact no-underline cursor-pointer")} href={`/chat/${room_id}`} onClick={handleClick}>
			<div className="rounded-lg h-15 px-2.5 hover:bg-accent/25 flex items-start gap-2.5">
				{/* Avatar */}
				<div className="h-full flex flex-row py-2.5">
					<Avatar
						disableTooltip={true}
						id={contact.id}
						src={contact.image}
						size="size-8.5"
						displayName={contact.displayName}
						statusIndicator={true}
						status={contact.username === "system" ? true : contact.online}
					/>
				</div>

				{/* Contact name + status */}
				<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
					{contact.displayName}
					<span className="text-sm text-muted">
						{contact.online || contact.username === "system" ? "Online" : "Offline"}
					</span>
				</div>

				<div className="flex h-full gap-2 items-center">
					<IconWithSVG
						data-tooltip-id={`tooltip-${contact.id}`}
						data-tooltip-content="Message"
						className="icon-contact-panel group/icon"
					>
						<IoChatbubble />
					</IconWithSVG>

					<IconWithSVG
						id="remove-friend-btn-contact-card"
						title={isPending ? "Syncing with server" : ""}
						disabled={isPending}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleRemove(
								{
									id: contact.id,
									username: contact.username,
								},
								"friend"
							);
						}}
						data-tooltip-id={`tooltip-${contact.id}`}
						data-tooltip-content={contact.username === "system" ? "Remove ChatBot" : "Remove Friend"}
						className="icon-contact-panel group/icon"
					>
						<RxCross2 className="group-hover/icon:text-error" />
					</IconWithSVG>
				</div>

				<Tooltip
					id={`tooltip-${contact.id}`}
					place="top"
					className="my-tooltip"
					border="var(--tooltip-border)"
					delayShow={200}
				/>
			</div>
		</Link>
	);
};

export const ContactPreviewSkeleton = () => {
	return (
		<section className="flex flex-col flex-1 animate-pulse">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="flex items-center gap-3 rounded-lg h-15 px-2.5 mb-2.5 bg-gray-100 dark:bg-gray-900">
					{/* Avatar */}
					<div className="w-8.5 h-8.5 rounded-full bg-gray-300 dark:bg-gray-800" />

					{/* Name and status */}
					<div className="flex-1">
						<div className="w-2/3 h-3.5 bg-gray-300 dark:bg-gray-500/40 rounded mb-1" />
						<div className="w-1/3 h-3 bg-gray-200 dark:bg-gray-500/25 rounded" />
					</div>

					{/* Action icons */}
					<div className="flex gap-2">
						<div className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-800" />
						<div className="w-5 h-5 rounded bg-gray-300 dark:bg-gray-800" />
					</div>
				</div>
			))}
		</section>
	);
};
