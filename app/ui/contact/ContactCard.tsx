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
import { useFriendsProvider } from "@/app/lib/friendsContext";
import { useToast } from "@/app/lib/hooks/useToast";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type MinimalUserType = { id: string; username: string };

export const ContactPreviewContainer = ({ user, contacts }: { user: User; contacts: ContactType[] }) => {
	const [localContacts, setLocalContacts] = useState<ContactType[]>(contacts);

	useEffect(() => {
		function handleStatusChange(userId: string, online: boolean) {
			setLocalContacts((prev) => {
				const index = prev.findIndex((chat) => chat.id.includes(userId));

				if (index === -1) return prev;
				const newContacts = [...prev];
				newContacts[index].online = online;
				return newContacts;
			});
		}

		socket.on("online", handleStatusChange);
		socket.on("offline", handleStatusChange);

		return () => {
			socket.off("online", handleStatusChange);
			socket.off("offline", handleStatusChange);
		};
	}, []);

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
				socket.emit("refresh-contacts-page", user.id, friend.id);
				setLocalContacts((prev) => prev.filter((req) => req.id !== friend.id));
				toast({ title: "Success!", mode: "positive", subtitle: result.message });
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
			{localContacts.map((contact) => (
				<ContactPreview
					isPending={pendingDeletes.has(contact.id)}
					user={user}
					handleRemove={handleRemove}
					contact={contact}
					key={contact.id}
				/>
			))}
		</section>
	);
};

export const ContactPreview = ({
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
	const { friends: contacts, setFriends: setContacts } = useFriendsProvider();
	const room_id =
		contact.username === "system" ? `system-room-${contact.id}:${user.id}` : getDMRoom(user.id, contact.id);

	const handleClick = async () => {
		// Check if DM already exists in state
		const dmExists = contacts.some((item) => item.room_id === room_id);
		if (dmExists) {
			console.log("DM already exists. No need to create.");
			return;
		}

		// Create DM if it doesn't exist
		const result = await createDM({ id: contact.id, username: contact.username });

		if (result.success) {
			setContacts((prev) => {
				// Check if contact with same id already exists
				const exists = prev.some((c) => c.id === contact.id);

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
						id={contact.id}
						src={contact.image}
						size="size-8.5"
						displayName={contact.displayName}
						statusIndicator={true}
						status={contact.username === "system" ? false : contact.online}
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
						data-tooltip-content="Remove Friend"
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
