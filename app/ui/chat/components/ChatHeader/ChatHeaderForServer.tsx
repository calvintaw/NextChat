"use client";

import { Room } from "@/app/lib/definitions";
import { User } from "@/app/lib/definitions";
import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";
import { Avatar } from "../../../general/Avatar";
import { ServerEditForm } from "../Server_edit_form";
import { GrHistory } from "react-icons/gr";
import { IconWithSVG } from "../../../general/Buttons";
import { clearMsgHistory, leaveServer } from "@/app/lib/actions";
import { usePathname, useRouter } from "next/navigation";

export function ServerCardHeader({ server, user }: { server: Room; user: User }) {
	const [clipboard, setClipboard] = useState("");
	const [localServer, setLocalServer] = useState(() => server);
	const pathname = usePathname();
	const router = useRouter();
	const [leavePending, setLeavePending] = useState(false);

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setClipboard(text);
			setTimeout(() => setClipboard(""), 5000);
		} catch (err) {
			console.error("Failed to copy!", err);
		}
	};

	const inviteLink = `@/invite/${server.id}`;

	return (
		<>
			<Tooltip
				id={`header-icons-tooltip`}
				place="left-start"
				className="small-tooltip"
				border="var(--tooltip-border)"
				offset={0}
			/>

			<div className="flex items-center justify-between mb-4 sticky border top-0 z-20 bg-contrast border-b border-contrast px-4 pr-2 max-lg:pr-1 py-1.5 border-t-0 border-l-0 border-r-0">
				<div className="flex items-center gap-1.5">
					<Avatar
						disableTooltip
						id={localServer.id}
						size={"size-5.5"}
						fontSize={"text-[11px] !no-underline"}
						displayName={localServer.name}
						src={localServer.profile ?? ""}
						statusIndicator={false}
					></Avatar>
					<h2 className="text-sm">{localServer.name}</h2>
				</div>

				<div className="flex gap-1.5 items-center">
					<IconWithSVG
						onClick={() => {
							const isConfirmed = window.confirm("Are you sure you want to delete all messages?");
							if (isConfirmed) clearMsgHistory(server.id, pathname);
						}}
						className="!size-7.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={"Clear history"}
					>
						<RiDeleteBin5Line className="text-lg" />
					</IconWithSVG>

					<IconWithSVG
						className="!size-7.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={clipboard === inviteLink ? "Copied!" : "Copy Invite Link"}
						onClick={() => handleCopy(inviteLink)}
					>
						<MdLink className="text-xl" />
					</IconWithSVG>

					{localServer.owner_id === user.id && (
						<ServerEditForm setLocalServer={setLocalServer} server={server} user={user} />
					)}
				</div>
			</div>
			<div className="bg-contrast text-white px-4 pb-2 rounded-lg w-full flex flex-col gap-3">
				<div className="flex items-center gap-3">
					{/* Server Icon */}
					<Avatar
						disableTooltip
						size="size-14"
						displayName={localServer.name}
						src={localServer.profile ?? ""}
						statusIndicator={false}
					/>
					<div className="flex-1 flex flex-col">
						{/* Server Name */}
						<h2 className="text-xl font-sem€ibold">{localServer.name ?? "No name"}</h2>

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
				<p className="text-sm text-gray-400 w-full">{localServer.description || "No description available"}</p>

				{/* Server Stats */}
				<div className="flex items-center gap-4 text-gray-400 text-sm">
					<div className="flex items-center gap-1">
						<div className="size-2 bg-emerald-500 rounded-full" />
						<OnlineCount currentUser={user} server={localServer}></OnlineCount>
					</div>
					<div className="flex items-center gap-1">
						<div className="size-2 bg-gray-400 rounded-full" />
						<p>{localServer.total_members?.toLocaleString() ?? 0} Members</p>
					</div>

					{localServer.owner_id !== user.id && (
						<button
							onClick={async () => {
								setLeavePending(true);
								await leaveServer(server.id);
								router.replace("/");
								setLeavePending(false);
							}}
							className="btn-secondary btn-wit-icon flex items-center gap-1 text-red-400 max-[420px]:hidden"
						>
							{!leavePending && (
								<>
									<TbLogout className="text-xl"></TbLogout> Leave Server
								</>
							)}
							{leavePending && (
								<>
									<BiLoaderAlt className="animate-spin text-lg" /> Leaving ...
								</>
							)}
						</button>
					)}
				</div>

				{localServer.owner_id !== user.id && (
					<button
						onClick={async () => {
							setLeavePending(true);
							await leaveServer(server.id);
							router.replace("/");
							setLeavePending(false);
						}}
						className="btn-secondary btn-wit-icon flex items-center gap-1 text-red-400 min-[420px]:hidden"
					>
						{!leavePending && (
							<>
								<TbLogout className="text-xl"></TbLogout> Leave Server
							</>
						)}
						{leavePending && (
							<>
								<BiLoaderAlt className="animate-spin text-lg" /> Leaving ...
							</>
						)}
					</button>
				)}
			</div>
		</>
	);
}

import { TbLogout } from "react-icons/tb";
import { supabase } from "@/app/lib/supabase";
import { RiDeleteBin5Line } from "react-icons/ri";
import { MdLink } from "react-icons/md";
import { BiLoaderAlt } from "react-icons/bi";

function OnlineCount({ server, currentUser }: { server: Room; currentUser: User }) {
	const [onlineUsersCount, setOnlineUsersCount] = useState(0);

	useEffect(() => {
		const channel = supabase.channel(`Room:${server.id}:online_users`, {
			config: { presence: { key: currentUser.id } },
		});

		// Sync is the truth: calculate online count
		const handleSync = () => {
			const state = channel.presenceState();
			setOnlineUsersCount(Object.keys(state).length);
		};

		// Join/leave should NOT touch contacts — only recalc via sync
		const handleJoin = handleSync;
		const handleLeave = handleSync;

		channel.on("presence", { event: "sync" }, handleSync);
		channel.on("presence", { event: "join" }, handleJoin);
		channel.on("presence", { event: "leave" }, handleLeave);

		channel.subscribe(async (status) => {
			if (status === "SUBSCRIBED") {
				await channel.track({});
			}
		});

		return () => {
			channel.untrack();
			channel.unsubscribe();
		};
	}, [currentUser, server]);

	return <p>{onlineUsersCount.toLocaleString()} Online</p>;
}
