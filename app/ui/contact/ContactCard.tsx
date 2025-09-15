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

type MinimalUserType = { id: string; username: string };

export const ContactPreviewContainer = ({ user, contacts }: { user: User; contacts: ContactType[] }) => {
	const [localContacts, setLocalContacts] = useState<ContactType[]>(contacts);

	useEffect(() => {
		setLocalContacts(contacts);
	}, [contacts]);

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
	const router = useRouter();

	const [error, setError] = useState("");
	const handleRemove = async (friend: MinimalUserType) => {
		// local ui instant updates

		const originalContacts = [...localContacts]
		setLocalContacts((prev) => prev.filter((req) => req.id !== friend.id));

		try {
			const result = await removeFriendshipRequest(friend);
			if (!result.success) {
				setLocalContacts(originalContacts); // rollback
				setError(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
				socket.emit("refresh-contacts-page", user.id, friend.id);
				// router.refresh();
				toast({ title: "Success!", mode: "positive", subtitle: result.message });
			}
		} catch (err) {
			setLocalContacts(originalContacts); // rollback
			setError("Failed to remove friend request");
			toast({ title: "Error!", mode: "negative", subtitle: "Failed to remove friend request." });
		}
	};

	return (
		<section className="flex flex-col flex-1">
			{error && <p className="text-sm text-error my-2">{error}</p>}
			{localContacts.map((contact) => (
				<ContactPreview user={user} handleRemove={handleRemove} contact={contact} key={contact.id} />
			))}
		</section>
	);
};

export const ContactPreview = ({
	handleRemove,
	user,
	contact,
}: {
	handleRemove: (friend: MinimalUserType) => void;
	user: User;
	contact: ContactType;
}) => {
	const { friends: contacts, setFriends: setContacts } = useFriendsProvider();
	const router = useRouter();
	const handleClick = async () => {
		const room_id = getDMRoom(user.id, contact.id);

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
		<Link
			className="cursor-pointer group/contact no-underline"
			href={`/chat/${getDMRoom(user.id, contact.id)}`}
			onClick={handleClick}
		>
			<div className="rounded-lg h-15 px-2.5 hover:bg-accent/25 flex items-start gap-2.5">
				{/* Avatar */}
				<div className="h-full flex flex-row py-2.5">
					<Avatar
						id={contact.id}
						src={contact.image}
						size="size-8.5"
						displayName={contact.displayName}
						statusIndicator={true}
						status={contact.online}
					/>
				</div>

				{/* Contact name + status */}
				<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
					{contact.displayName}
					<span className="text-sm text-muted">{contact.online ? "Online" : "Offline"}</span>
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
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();

							handleRemove({
								id: contact.id,
								username: contact.username,
							});
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
