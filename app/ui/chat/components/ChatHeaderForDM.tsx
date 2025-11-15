"use client";

import {
	getServersInCommon,
	blockFriendship,
	removeFriendshipRequest,
	unblockFriendship,
	clearMsgHistory,
} from "@/app/lib/actions";
import { Room } from "@/app/lib/definitions";
import { User } from "@/app/lib/definitions";
import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { Avatar } from "../../general/Avatar";
import { usePathProvider } from "@/app/lib/contexts/PathContext";
import clsx from "clsx";
import { useToast } from "@/app/lib/hooks/useToast";
import { useChatProvider } from "../ChatBoxWrapper";
import { GrHistory } from "react-icons/gr";
import { IconWithSVG } from "../../general/Buttons";
import { ServerList } from "./ChatHeaderServerList";
import { usePathname, useRouter } from "next/navigation";

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

	// useEffect(() => {
	// 	if (roomId.startsWith("system-room")) return;

	// 	const fetchCommonServers = async () => {
	// 		setIsPending(true);
	// 		try {
	// 			const servers = await getServersInCommon(currentUserId, user.id);
	// 			setCommonServers(servers);
	// 		} catch (err) {
	// 			console.error(err);
	// 			setCommonServers([]);
	// 		} finally {
	// 			setIsPending(false);
	// 		}
	// 	};

	// 	fetchCommonServers();
	// }, [user.id]);

	return (
		<>
			<Tooltip
				id={`header-icons-tooltip`}
				place="left-start"
				className="small-tooltip"
				border="var(--tooltip-border)"
				offset={0}
			/>

			<div className="flex items-center justify-between mb-4 sticky border top-0 z-20 bg-contrast border-b border-contrast px-4 py-1.5 border-t-0 border-l-0 border-r-0">
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

				<div className="flex gap-1.5">
					<IconWithSVG
						onClick={() => {
							clearMsgHistory(roomId, pathname);
						}}
						className="!size-6.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={"Clear history"}
					>
						<GrHistory className="text-lg" />
					</IconWithSVG>
				</div>
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
					This is the beginning of your direct message history with{" "}
					{roomId.startsWith("system-room") && <span className="text-text font-medium">Our AI Chatbot</span>}
					{!roomId.startsWith("system-room") && <span className="text-text font-medium">{user.username}</span>}.
				</div>
				{!roomId.startsWith("system-room") && (
					<div className="flex items-center gap-2">
						<button
							className={clsx("btn", isBlocked ? "btn-inverted" : "btn-secondary")}
							onClick={() => {
								if (isBlocked) {
									unblockFriendship(currentUserId, user.id);
								} else {
									blockFriendship(currentUserId, user.id);
								}
							}}
						>
							{isBlocked ? "Unblock" : "Block"}
						</button>
						<button
							className="btn btn-secondary"
							onClick={async () => {
								const result = await removeFriendshipRequest({ username: user.username, id: user.id }, "friend");
								if (result.success) {
									toast({ title: result.message, mode: "positive", subtitle: "" });
								}
							}}
						>
							Unfriend
						</button>
					</div>
				)}

				{!roomId.startsWith("system-room") &&
					(isPending ? (
						<p className="text-xs text-gray-500 mt-2">Loading servers in common...</p>
					) : (
						<ServerList servers={commonServers} />
					))}
				{roomId.startsWith("system-room") && (
					<>
						<p className="text-base text-primary">
							Hi! I can answer your questions using DeepSeek — now powered via Hugging Face
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
