"use client";

import { getServersInCommon, blockFriendship, removeFriendshipRequest, unblockFriendship } from "@/app/lib/actions";
import { Room } from "@/app/lib/definitions";
import { User } from "@/app/lib/definitions";
import { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { Avatar } from "../../general/Avatar";
import { ServerList } from "../Chatbox";
import { usePathProvider } from "@/app/lib/PathContext";

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
		<div className="bg-contrast text-white p-6 px-4 pb-2 rounded-lg max-w-full">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-3">
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
				<button
					className="btn btn-secondary"
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
					onClick={() => removeFriendshipRequest({ username: user.username, id: user.id })}
				>
					Unfriend
				</button>
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
