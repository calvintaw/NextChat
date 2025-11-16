"use client";

import {
	getServersInCommon,
	unblockFriendship,
	blockFriendship,
	removeFriendshipRequest,
	clearMsgHistory,
} from "@/app/lib/actions";
import { usePathProvider } from "@/app/lib/contexts/PathContext";
import { Room } from "@/app/lib/definitions";
import { useToast } from "@/app/lib/hooks/useToast";
import { Avatar } from "@/app/ui/general/Avatar";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import clsx from "clsx";
import { User } from "@/app/lib/definitions";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { MdBlock, MdPersonRemove } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { Tooltip } from "react-tooltip";
import { useChatProvider } from "../../ChatBoxWrapper";
import { ServerList } from "./components/ChatHeaderServerList";
import { CallVideoChatDialog } from "./components/VideoCallDialog";

export function DirectMessageCard({
	roomId,
	currentUserId,
	isBlocked,
	user,
}: {
	roomId: string;
	currentUserId: string;
	user: User;
	isBlocked: boolean;
}) {
	const [clipboard, setClipboard] = useState("");
	const [commonServers, setCommonServers] = useState<Room[]>([]);
	const [isPending, setIsPending] = useState(true);
	const { setPath } = usePathProvider();
	const { isSystem } = useChatProvider();
	const toast = useToast();
	const pathname = usePathname();

	useEffect(() => {
		setPath(`@${user.username}`);

		return () => {
			setPath("");
		};
	}, []);

	const handleCopy = (string: string) => {
		window.navigator.clipboard.writeText(string);
		setClipboard(string);
	};

	useEffect(() => {
		if (roomId.startsWith("system-room")) return;

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
		<>
			<Tooltip
				id={`header-icons-tooltip`}
				place="left-start"
				className="small-tooltip"
				border="var(--tooltip-border)"
				offset={0}
			/>
			{/* chat-header-mini */}
			<div className="flex items-center justify-between mb-4 sticky border-b border-contrast  top-0 z-20 bg-contrast px-4 pr-2 max-lg:pr-1 py-1.5">
				<div className="flex items-center gap-1.5">
					<Avatar
						id={user.id}
						size={"size-5.5"}
						displayName={user.username}
						src={user.image}
						fontSize={"text-[11px]"}
						statusIndicator={false}
					></Avatar>
					<h2 className="text-sm">{user.username}</h2>
				</div>

				<div className="flex gap-2 items-center">
					{!roomId.startsWith("system-room") && (
						<>
							<CallVideoChatDialog user={user} />

							<IconWithSVG
								onClick={() => {
									if (isBlocked) {
										unblockFriendship(currentUserId, user.id);
									} else {
										blockFriendship(currentUserId, user.id);
									}
								}}
								className={clsx("!size-7.5", isBlocked ? "btn-inverted" : "btn-secondary")}
								data-tooltip-id="header-icons-tooltip"
								data-tooltip-content={isBlocked ? "Unblock" : "Block"}
							>
								<MdBlock className="text-lg" />
							</IconWithSVG>

							<IconWithSVG
								onClick={async () => {
									const result = await removeFriendshipRequest({ username: user.username, id: user.id }, "friend");
									if (result.success) {
										toast({ title: result.message, mode: "positive", subtitle: "" });
									}
								}}
								className="!size-7.5"
								data-tooltip-id="header-icons-tooltip"
								data-tooltip-content="Unfriend"
							>
								<MdPersonRemove className="text-lg" />
							</IconWithSVG>
						</>
					)}

					<IconWithSVG
						onClick={() => {
							const isConfirmed = window.confirm("Are you sure you want to delete all messages?");
							if (isConfirmed) clearMsgHistory(roomId, pathname);
						}}
						className="!size-7.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={"Clear history"}
					>
						<RiDeleteBin5Line className="text-lg" />
					</IconWithSVG>
				</div>

				{/* <div className="flex gap-2 items-center">
					{!roomId.startsWith("system-room") && (
						<>
							<CallVideoChatDialog user={user} />
							<button
								className={clsx(
									"btn btn-small !w-fit p-1 px-1.5 btn-with-icon items-center flex gap-1.5",
									isBlocked ? "btn-inverted" : "btn-secondary"
								)}
								onClick={() => {
									if (isBlocked) {
										unblockFriendship(currentUserId, user.id);
									} else {
										blockFriendship(currentUserId, user.id);
									}
								}}
							>
								<MdBlock />
								{isBlocked ? "Unblock" : "Block"}
							</button>
							<button
								className="btn btn-small !w-fit p-1 px-1.5 btn-with-icon items-center flex gap-1.5 btn-secondary"
								onClick={async () => {
									const result = await removeFriendshipRequest({ username: user.username, id: user.id }, "friend");
									if (result.success) {
										toast({ title: result.message, mode: "positive", subtitle: "" });
									}
								}}
							>
								<MdPersonRemove />
								Unfriend
							</button>
						</>
					)}

					<IconWithSVG
						onClick={() => {
							const isConfirmed = window.confirm("Are you sure you want to delete all messages?");
							if (isConfirmed) clearMsgHistory(roomId, pathname);
						}}
						className="!size-7.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={"Clear history"}
					>
						<RiDeleteBin5Line className="text-lg" />
					</IconWithSVG>
				</div> */}
			</div>
			<div className="bg-contrast text-white px-4 pb-2 rounded-lg max-w-full">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-3">
						<Avatar
							id={user.id}
							size={"size-12"}
							displayName={user.username}
							src={user.image}
							statusIndicator={false}
						></Avatar>
						<div>
							<h2 className="text-xl font-semibold">{user.displayName}</h2>
							<div role="contentinfo" className="text-sm text-gray-400 cursor-pointer" data-tooltip-id={user.username}>
								@<span onClick={() => handleCopy(user.username)}>{user.username}</span>
								<Tooltip className="my-tooltip" id={user.username} place="right" border={`var(--tooltip-border)`}>
									<span className="flex items-center gap-1">
										{clipboard === user.username ? (
											<span>
												<FaCheck className="text-green-500" />
												Copied: {user.username}
											</span>
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
					This is the beginning of your DM history with{" "}
					{roomId.startsWith("system-room") && <span className="text-text font-medium">Our AI Chatbot</span>}
					{!roomId.startsWith("system-room") && <span className="text-text font-medium">{user.username}</span>}.
				</div>

				{!roomId.startsWith("system-room") &&
					(isPending ? (
						<p className="text-xs text-gray-500 mt-2">Loading servers in common...</p>
					) : (
						<ServerList servers={commonServers} />
					))}
				{roomId.startsWith("system-room") && (
					<>
						<p className="text-sm text-primary bg-background px-3 py-1.5 rounded-md">
							Hi! I can answer your questions using DeepSeek — now powered via Hugging Face.
						</p>
					</>
				)}
				{roomId.startsWith("system-room") && isBlocked && isSystem && (
					<p className="text-base text-amber-400 not-dark:text-amber-500">
						Due to difficulties in finding free apis and hosting own llms, the AI chatbot may be not work 😢
					</p>
				)}
			</div>
		</>
	);
}
