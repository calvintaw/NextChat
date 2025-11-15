"use client";
import {
	requestFriendship,
	getContacts,
	getFriendRequests,
	acceptFriendshipRequest,
	removeFriendshipRequest,
	getUser,
} from "@/app/lib/actions";
import { ContactType } from "@/app/lib/definitions";
import { socket } from "@/app/lib/socket";
import * as Tabs from "@radix-ui/react-tabs";
import { useActionState, useState, useRef, useEffect } from "react";
import { FaUserFriends } from "react-icons/fa";
import { GoDotFill } from "react-icons/go";
import { MdCheck } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { Tooltip } from "react-tooltip";
import InputField from "../form/InputField";
import { Avatar } from "../general/Avatar";
import { Badge, Button, IconWithSVG } from "../general/Buttons";
import Search from "../general/Search";
import { ContactPreviewContainer, ContactPreviewSkeleton } from "./ContactCard";
import { User } from "@/app/lib/definitions";
import { BiLoaderAlt } from "react-icons/bi";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type friendRequestsType = { sent: User[]; incoming: User[] };

type ContactTabsProps = {
	user: User;
	// initialContacts: ContactType[];
	initialFriendRequests: friendRequestsType;
};

type AddContactTabProps = {
	formAction: (formData: FormData) => void;
	addFriendInputRef: React.RefObject<HTMLInputElement | null>;
	request: { success: boolean; message: string };
	isPending: boolean;
};

type RequestTabProps = {
	user: User;
	friendRequests: friendRequestsType;
	setFriendRequests: React.Dispatch<React.SetStateAction<friendRequestsType>>;
	setContacts: React.Dispatch<React.SetStateAction<ContactType[]>>;
};

type AllContactsTabProps = {
	initialLoad: boolean;
	friendsCount: number;
	setContacts: React.Dispatch<React.SetStateAction<ContactType[]>>;
	contacts: ContactType[];
	user: User;
};

const ContactTabs = ({ user, initialFriendRequests }: ContactTabsProps) => {
	const toast = useToast();

	const [request, formAction, isPending] = useActionState(
		async (prevState: { success: boolean; message: string }, formData: FormData) => {
			let username = (formData.get("username") as string | null)?.trim() ?? "";
			if (username.startsWith("@")) username = username.slice(1);

			if (username === "system") {
				const result = await acceptFriendshipRequest(user, true);
				return { success: result.success, message: result.message };
			}

			const result = await requestFriendship(prevState, formData);
			if (result.success && result.targetUser) {
				// socket.emit("refresh-contacts-page", user.id, result.targetUser.id);
				// local update
				setFriendRequests((prev) => ({
					incoming: [...prev.incoming],
					sent: [...prev.sent, { ...result.targetUser! }],
				}));
				toast({ title: "Success!", mode: "positive", subtitle: request.message });
			} else {
				toast({
					title: "Error!",
					mode: "negative",
					subtitle: result.message || "Failed to send friend request. Please try again.",
				});
			}

			return { success: result.success, message: result.message };
		},
		{ success: false, message: "" }
	);

	const [initialLoad, setInitialLoad] = useState(true);

	const [friendRequests, setFriendRequests] = useState<friendRequestsType>(initialFriendRequests);
	// const [contacts, setContacts] = useState(initialContacts);

	const { contacts, setContacts } = useFriendsProvider();
	const addFriendInputRef = useRef<HTMLInputElement | null>(null);
	const friendsCount = contacts.length;

	// useEffect(() => {
	// 	socket.emit("join", user.id);
	// 	async function refrechContactsPage() {
	// 		const [newContacts, newRequests] = await Promise.all([getContacts(user.id), getFriendRequests(user.id)]);
	// 		setContacts(newContacts);
	// 		setFriendRequests(newRequests);
	// 	}

	// 	// the code can be refactored to be more efficient, for example, sending the new info via socket instead of fetching from db or fetching from db but only the required ones
	// 	// TODO task (maybe)
	// 	socket.on(`refresh-contacts-page`, refrechContactsPage);
	// 	return () => {
	// 		socket.off(`refresh-contacts-page`, refrechContactsPage);
	// 		socket.disconnect();
	// 	};
	// }, []);

	useEffect(() => {
		const fetchContacts = async () => {
			const contacts = await getContacts(user.id);
			setContacts(contacts);
			setInitialLoad(false);
		};

		fetchContacts();
	}, []);

	useEffect(() => {
		const channel = supabase.channel(`friends:${user.id}`);
		//@ts-ignore
		const handler = async (payload) => {
			if (payload.eventType === "INSERT") {
				const data = payload.new;
				if (data.status === "pending") {
					const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;

					// early return bc there's already local UI update if user is the one who sent the request
					if (data.request_sender_id === user.id) return;

					const recipient = await getUser(recipient_id);
					if (!recipient) return;

					if (data.request_sender_id === user.id) {
						setFriendRequests((prev) => ({
							sent: [...prev.sent, recipient],
							incoming: prev.incoming,
						}));
					} else {
						setFriendRequests((prev) => ({
							sent: prev.sent,
							incoming: [...prev.incoming, recipient],
						}));
					}
				} else if (data.status === "accepted") {
					const data = payload.new;
					const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;

					// early return bc there's already local UI Update if user accepted an incoming friend request
					if (data.request_sender_id !== user.id) return;
					const recipient = await getUser(recipient_id);
					if (!recipient) return;
					const { createdAt, bio, password, readme, ...rest } = recipient;
					if (rest.username === "system") {
						setContacts((prev) => [{ ...rest, online: rest.username === "system" ? true : "loading" }, ...prev]);
					} else {
						setContacts((prev) => [...prev, { ...rest, online: rest.username === "system" ? true : "loading" }]);
					}
				}
			} else if (payload.eventType === "DELETE") {
				const data = payload.old;
				const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;

				setFriendRequests((prev) => ({
					sent: prev.sent,
					incoming: prev.incoming.filter((person) => person.id !== recipient_id),
				}));

				setContacts((prev) => prev.filter((person) => person.id !== recipient_id));
			} else if (payload.eventType === "UPDATE") {
				const data = payload.new;
				const recipient_id = data.user1_id === user.id ? data.user2_id : data.user1_id;

				if (data.status === "accepted") {
					// early return bc there's already local UI Update if user accepted an incoming friend request
					if (data.request_sender_id !== user.id) return;

					setFriendRequests((prev) => ({
						sent: prev.sent.filter((person) => person.id !== recipient_id),
						incoming: prev.incoming.filter((person) => person.id !== recipient_id),
					}));

					const recipient = await getUser(recipient_id);
					if (!recipient) return;
					const { createdAt, bio, password, readme, ...rest } = recipient;
					setContacts((prev) => [...prev, { ...rest, online: "loading" }]);
				}
			}
		};

		// A. Postgres Changes
		channel
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "friends",
					filter: `user1_id=eq.${user.id}`,
				},
				handler
			)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "friends",
					filter: `user2_id=eq.${user.id}`,
				},
				handler
			);

		channel.subscribe((status) => {
			if (status === "SUBSCRIBED") console.log(`Subscribed to friends-${user.username}`);
		});

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

	const searchParams = useSearchParams();
	const initialTab = searchParams.get("tab") || "all";
	const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

	const router = useRouter();

	return (
		<>
			<section className="border-r-2 border-border/10 h-full flex flex-col px-[clamp(6px,2vw,16px)] py-2 pt-0 bg-contrast">
				<Tabs.Root
					defaultValue={initialTab}
					onValueChange={(tab) => {
						setActiveTab(tab);
						router.replace(`/?tab=${tab}`);
					}}
					className="flex flex-col h-full"
				>
					<Tabs.List className="my-3 flex gap-2 items-center">
						<div className="flex items-center gap-2 mr-2 max-sm:hidden">
							<FaUserFriends className="text-[clamp(1rem,4vw,1.5rem)] text-muted" />
							<p className="text-muted font-medium">Friends</p>
							<GoDotFill className="text-xs text-muted mt-0.5" />
						</div>

						<Tabs.Trigger value="all" asChild>
							<Button className="bg-accent/15 border-transparent text-text hover:bg-accent/80 data-[state=active]:bg-accent/80 data-[state=active]:cursor-default">
								All
							</Button>
						</Tabs.Trigger>

						{/* {(friendRequests.sent.length > 0 || friendRequests.incoming.length > 0) && ( */}
						<Tabs.Trigger value="request" asChild>
							<Button className="bg-accent/15 border-transparent text-text hover:bg-accent/80 data-[state=active]:bg-accent/80 data-[state=active]:cursor-default flex items-center gap-2">
								Pending
								{friendRequests.incoming.length >= 1 && <Badge count={friendRequests.incoming.length}></Badge>}
							</Button>
						</Tabs.Trigger>
						{/* )} */}

						<Tabs.Trigger
							value="add"
							asChild
							onClick={() => {
								addFriendInputRef.current?.focus();
							}}
						>
							<Button className="bg-primary hover:bg-primary/80 data-[state=active]:bg-primary/25 data-[state=active]:text-primary data-[state=active]:cursor-default ">
								Add Friend
							</Button>
						</Tabs.Trigger>

						<div className="flex items-center gap-2 mx-2 max-[445px]:hidden">
							<TbMinusVertical className="text-2xl text-muted/75 mt-0.5" />
						</div>

						<Tabs.Trigger value="games" asChild>
							<Button
								className="bg-accent/15  text-text hover:bg-accent/80 data-[state=active]:bg-accent/80 data-[state=active]:cursor-default btn-secondary-border max-[445px]:hidden
							"
							>
								Games
							</Button>
						</Tabs.Trigger>

						<Tabs.Trigger value="games" asChild>
							{activeTab !== "games" && (
								<IconWithSVG
									className="!size-9.5 btn-secondary-border !absolute !bottom-5 !right-5 z-10"
									data-tooltip-id="Games-icon"
									data-tooltip-content={"Feeling Bored? Play a fun game with your friends! 😃"}
								>
									<IoGameController className="text-2xl" />
								</IconWithSVG>
							)}
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="all" asChild>
						<AllContactsTab
							initialLoad={initialLoad}
							setContacts={setContacts}
							friendsCount={friendsCount}
							contacts={contacts}
							user={user}
						/>
					</Tabs.Content>

					<Tabs.Content value="request" asChild>
						<RequestTab
							setContacts={setContacts}
							user={user}
							setFriendRequests={setFriendRequests}
							friendRequests={friendRequests}
						/>
					</Tabs.Content>

					<Tabs.Content value="add" asChild>
						<AddContactTab
							isPending={isPending}
							formAction={formAction}
							addFriendInputRef={addFriendInputRef}
							request={request}
						/>
					</Tabs.Content>

					<Tabs.Content value="games" asChild>
						<GamesTab></GamesTab>
					</Tabs.Content>
				</Tabs.Root>
			</section>

			<Tooltip id={`tooltip-friendship`} place="top" className="my-tooltip" border="var(--tooltip-border)" />
			<Tooltip id={`Games-icon`} place="left-start" className="my-tooltip" border="var(--tooltip-border)" />
		</>
	);
};

const AddContactTab = ({ formAction, addFriendInputRef, request, isPending }: AddContactTabProps) => {
	return (
		<div className="p-2 sm:p-4">
			<div className="flex flex-col gap-2 my-3 mb-5">
				<h1 className="text-[clamp(1rem,4vw,1.5rem)] font-semibold ">Add Friends</h1>
				<p className="text-base">You can add friends with their username.</p>
			</div>
			<form action={formAction} className="group">
				<InputField
					disabled={isPending}
					ref={addFriendInputRef}
					parentClassName="h-fit py-0.5 px-1.5 sm:py-2 rounded-lg"
					name="username"
					placeholder="You can add friends with their username."
					place="right"
					errors={[request.message]}
					success={request.success ? request.message : ""}
					icon={
						<>
							<button
								disabled={isPending}
								type="submit"
								className="
								max-sm:hidden
								bg-primary btn-with-icon opacity-65 group-focus-within:opacity-100 hover:bg-primary/75 active:bg-primary/50 py-1 sm:py-1.5 px-2 sm:px-3 text-[0.938rem] text-white rounded-md sm:rounded-lg sm:mr-0.5"
							>
								{isPending ? "Sending Friend Request" : "Send Friend Request"}
								{isPending && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
							</button>
						</>
					}
				></InputField>
				<button
					disabled={isPending}
					type="submit"
					className="
								min-sm:hidden
								bg-primary btn-with-icon opacity-65 group-focus-within:opacity-100 hover:bg-primary/75 active:bg-primary/50 py-1 sm:py-1.5 px-2 sm:px-3 text-[0.938rem] text-white rounded-md sm:rounded-lg sm:mr-0.5"
				>
					{isPending ? "Sending Friend Request" : "Send Friend Request"}
					{isPending && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
				</button>
			</form>

			<p className="my-2 text-sm text-muted">
				Tip: <span>use @system to get access to the AI ChatBot Room</span>
			</p>

			<hr className="hr-separator" />
			{/* <span className="text-muted text-sm">Recommended ~</span>

			<hr className="hr-separator my-2 bg-transparent" />

			<p className="text-muted">- Recommended Friends functionality coming soon...</p> */}
		</div>
	);
};

import { BsFilterLeft } from "react-icons/bs";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/lib/hooks/useToast";
import { IoGameController } from "react-icons/io5";
import { TbMinusVertical } from "react-icons/tb";
import GameCard from "../games/GameCard";
import { Route } from "next";
import { supabase } from "@/app/lib/supabase";
import { getDMRoom } from "@/app/lib/utilities";
import SupabasePresence from "../SupabasePresence";
import { useFriendsProvider } from "@/app/lib/contexts/friendsContext";

const RequestTab = ({ user, friendRequests, setFriendRequests, setContacts }: RequestTabProps) => {
	const [error, setError] = useState("");
	const [isPending, setIsPendingIds] = useState(new Set<string>());
	const toast = useToast();

	function handlePending(id: string, pending: boolean) {
		if (pending) {
			setIsPendingIds((prev) => new Set(prev).add(id));
		} else {
			setIsPendingIds((prev) => {
				const newSet = new Set(prev);
				newSet.delete(id);
				return newSet;
			});
		}
	}

	const handleAccept = async (friend: User) => {
		handlePending(friend.id, true);
		try {
			const result = await acceptFriendshipRequest(friend);

			if (!result.success) {
				setError(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
				// socket.emit("refresh-contacts-page", user.id, friend.id);
				const { createdAt, ...contact } = friend;

				// local update
				setContacts((prev) => {
					return [...prev, { ...contact, online: "loading" }]; // online is set to loading as we don't know the user status yet. Online will be turned on if our socket listener on ContactCard file catches "online" event
				});
				// local update
				setFriendRequests((prev) => ({
					...prev,
					incoming: prev.incoming.filter((req) => req.id !== friend.id),
				}));

				// setContacts((prev) => [...prev, {}]);

				toast({ title: "Success!", mode: "positive", subtitle: result.message });
			}
		} catch (err) {
			setError("Failed to accept friend request.");
			toast({ title: "Error!", mode: "negative", subtitle: "Failed to accept friend request." });
		} finally {
			handlePending(friend.id, false);
		}
	};

	const handleRemove = async (friend: User, type: "incoming" | "sent") => {
		handlePending(friend.id, true);
		try {
			const result = await removeFriendshipRequest(friend, type);
			if (!result.success) {
				setError(result.message);
				toast({ title: "Error!", mode: "negative", subtitle: result.message });
			} else {
				// socket.emit("refresh-contacts-page", user.id, friend.id);
				// local update
				setFriendRequests((prev) => ({
					...prev,
					[type]: prev[type].filter((req) => req.id !== friend.id),
				}));

				toast({ title: "Success!", mode: "positive", subtitle: result.message });
			}
		} catch (err) {
			setError("Failed to remove friend request");
			toast({ title: "Error!", mode: "negative", subtitle: "Failed to remove friend request" });
		} finally {
			handlePending(friend.id, false);
		}
	};

	const [filter, setFiltered] = useState<"all" | "incoming" | "sent">("all");
	let total = 0;
	if (filter === "all") {
		total = friendRequests.incoming.length + friendRequests.sent.length;
	} else if (filter === "incoming") {
		total = friendRequests.incoming.length;
	} else if (filter === "sent") {
		total = friendRequests.sent.length;
	}

	return (
		<>
			<div className="p-2 px-1.5 pb-0">
				<div className="flex flex-row justify-between items-center sm:items-end gap-2 my-3">
					<div className="flex flex-col gap-2">
						<h1 className="text-[clamp(1rem,4vw,1.5rem)] font-semibold ">Friendship Requests</h1>
						<p className="text-base sm:block hidden">You can accept friendship requests here.</p>
					</div>
					<div className="flex gap-2">
						<button className="bg-amber-500 cursor-default text-white dark:bg-yellow-600">Total: {total}</button>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild>
								<button className=" btn-wtih-icon flex items-center gap-1 !pl-2">
									<BsFilterLeft className="text-[clamp(1rem,4vw,1.5rem)]"></BsFilterLeft>
									Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
								</button>
							</DropdownMenu.Trigger>

							<DropdownMenu.Content loop sideOffset={5} align="start" className="DropdownMenu__Content">
								<DropdownMenu.Item onClick={() => setFiltered("all")} className="DropdownMenuItem">
									All
								</DropdownMenu.Item>
								<DropdownMenu.Item onClick={() => setFiltered("incoming")} className="DropdownMenuItem">
									Incoming
								</DropdownMenu.Item>

								<DropdownMenu.Item onClick={() => setFiltered("sent")} className="DropdownMenuItem">
									Sent
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>

				<hr className="hr-separator my-2 bg-transparent" />

				{error && <p className="text-error text-sm my-2">{error}</p>}
			</div>

			<div className="flex flex-col p-2 px-0 pr-1 h-full overflow-y-auto has-scroll-container fade-bg-bottom pb-[100px]">
				{friendRequests.incoming.length !== 0 && filter !== "sent" && (
					<>
						<div className="flex flex-col gap-2">
							{friendRequests.incoming.map((friend) => (
								<div
									key={friend.id}
									className="rounded-lg h-15 px-2.5 hover:bg-secondary/75 flex items-center gap-2.5
          group/contact"
								>
									{/* Avatar */}
									<div className="h-full mr-1 flex flex-row py-3">
										<Avatar
											statusIndicator={false}
											id={friend.id}
											src={friend.image}
											size="size-8"
											displayName={friend.displayName}
										/>
									</div>

									<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate leading-tight">
										<p className="text-base m-0">{friend.displayName}</p>
										<p className="text-muted text-[13.5px] -mt-0.5">{friend.username}</p>
									</div>

									<div className={clsx("flex-1 text-center", filter !== "all" && "hidden")}>
										<p
											className={clsx(
												"text-muted text-sm w-fit flex flex-col",
												isPending.has(friend.id) && "-mb-1.5 mt-1.5"
											)}
										>
											incoming
											{isPending.has(friend.id) && (
												<span className="text-sm text-muted flex items-center justify-center gap-1">
													<BiLoaderAlt className="animate-spin"></BiLoaderAlt>
													syncing
												</span>
											)}
										</p>
									</div>

									<div className="flex gap-2 min-w-18 justify-end">
										<IconWithSVG
											disabled={isPending.has(friend.id)}
											onClick={() => {
												handleAccept(friend);
											}}
											data-tooltip-id={`tooltip-friendship`}
											data-tooltip-content="Accept"
											className="icon-contact-panel group/icon"
										>
											<MdCheck className="group-hover/icon:text-success" />
										</IconWithSVG>

										<IconWithSVG
											disabled={isPending.has(friend.id)}
											onClick={() => {
												handleRemove(friend, "incoming");
											}}
											data-tooltip-id={`tooltip-friendship`}
											data-tooltip-content="Ignore"
											className="icon-contact-panel group/icon"
										>
											<RxCross2 className="group-hover/icon:text-error" />
										</IconWithSVG>
									</div>
								</div>
							))}
						</div>
					</>
				)}

				{friendRequests.sent.length !== 0 && filter !== "incoming" && (
					<>
						<div className="flex flex-col gap-2">
							{friendRequests.sent.map((friend) => (
								<div
									key={friend.id}
									className="rounded-lg h-15 px-2.5 hover:bg-secondary/75 flex items-center gap-2.5
										group/contact
										"
								>
									{/* Avatar */}
									<div className="h-full mr-1 flex flex-row py-3">
										<Avatar
											statusIndicator={false}
											id={friend.id}
											src={friend.image}
											size="size-8"
											displayName={friend.displayName}
										/>
									</div>

									<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate leading-tight">
										<p className="text-base m-0">{friend.displayName}</p>
										<p className="text-muted text-[13.5px] -mt-0.5">{friend.username}</p>
									</div>

									<div className={clsx("flex-1 text-center", filter !== "all" && "hidden")}>
										<p
											className={clsx(
												"text-muted w-fit text-sm flex flex-col",
												isPending.has(friend.id) && "-mb-1.5 mt-1.5"
											)}
										>
											sent
											{isPending.has(friend.id) && (
												<span className="text-sm text-muted flex items-center justify-center gap-1">
													<BiLoaderAlt className="animate-spin"></BiLoaderAlt>
													syncing
												</span>
											)}
										</p>
									</div>

									<div className="flex gap-2 min-w-18 justify-end">
										<IconWithSVG
											disabled={isPending.has(friend.id)}
											onClick={() => {
												// TODO: use toast noti to show users the result of their actions
												handleRemove(friend, "sent");
											}}
											data-tooltip-id={`tooltip-friendship`}
											data-tooltip-content="Cancel"
											className="icon-contact-panel group/icon"
										>
											<RxCross2 className="group-hover/icon:text-error" />
										</IconWithSVG>
									</div>

									<Tooltip
										id={`tooltip-friendship`}
										place="top"
										className="my-tooltip"
										border="var(--tooltip-border)"
									/>
								</div>
							))}
						</div>
					</>
				)}

				{friendRequests.sent.length === 0 && friendRequests.incoming.length === 0 && (
					<div className="flex flex-1 items-center justify-center">
						<p className="text-muted max-[700px]:text-center">
							There are no pending friend requests. Click "Add Friend" to send friend requests
						</p>
					</div>
				)}
			</div>
		</>
	);
};

const AllContactsTab = ({ initialLoad, friendsCount, contacts, user, setContacts }: AllContactsTabProps) => {
	const [input, setInput] = useState("");
	const filteredContacts = contacts.filter(
		(s) =>
			s.displayName.toLowerCase().includes(input.toLowerCase()) ||
			s.username.toLowerCase().includes(input.toLowerCase())
	);
	return (
		<div className="flex flex-col flex-1">
			<Search setInput={setInput} />
			<div className="mt-5 flex flex-col gap-4">
				<p className="text-sm flex items-center gap-2">
					All Friends -{" "}
					{initialLoad ? (
						<span className="h-6 w-8 bg-gray-300 dark:bg-gray-800 rounded animate-pulse inline-block" />
					) : (
						friendsCount
					)}
				</p>

				<hr className="hr-separator !m-0" />
			</div>

			{initialLoad ? (
				<ContactPreviewSkeleton />
			) : (
				<ContactPreviewContainer setContacts={setContacts} user={user} contacts={filteredContacts} />
			)}
		</div>
	);
};

export const gamesData = [
	{
		imgSrc: "/tictactoe/tictactoe.png",
		title: "Tic Tac Toe",
		description: "Play the classic 2-player game of strategy and skill. Get three in a row to win!",
		href: "/games/tictactoe" as Route,
	},
	{
		imgSrc: "/snake/snake.png",
		title: "Snake",
		description: "Guide the snake to eat food and grow longer — but don’t run into yourself or the walls!",
		href: "/games/snake" as Route,
	},
];

const GamesTab = () => {
	return (
		<>
			<div className="p-2 px-1.5 pb-0">
				<div className="flex flex-row justify-between items-center sm:items-end gap-2 my-3">
					<div className="flex flex-col gap-2">
						<h1 className="text-[clamp(1rem,4vw,1.5rem)] font-semibold ">Available Games</h1>
					</div>
				</div>
				<hr className="hr-separator my-2 bg-transparent" />
			</div>

			<div className="flex gap-4 flex-wrap ">
				{gamesData.map((game, index) => (
					<GameCard
						key={index}
						imgSrc={game.imgSrc}
						title={game.title}
						description={game.description}
						href={game.href}
					/>
				))}
			</div>

			<div className="flex flex-col p-2 px-0 pr-1 h-full overflow-y-auto has-scroll-container fade-bg-bottom pb-[100px]"></div>
		</>
	);
};

export default ContactTabs;
