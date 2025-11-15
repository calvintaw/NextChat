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
import { MdBlock, MdPersonRemove, MdVideoCall } from "react-icons/md";
import { RiDeleteBin5Line } from "react-icons/ri";
import { IoCall } from "react-icons/io5";

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

			<div className="flex items-center justify-between mb-4 sticky border-b border-contrast  top-0 z-20 bg-contrast px-4 pr-2 max-lg:pr-1 py-1.5 ">
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
					<CallVideoChatDialog user={user} />

					{!roomId.startsWith("system-room") && (
						<>
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

import * as Dialog from "@radix-ui/react-dialog";
import { HiOutlineX } from "react-icons/hi";
import { PiVideoCameraFill } from "react-icons/pi";
import bcryptjs from "bcryptjs";
import { uuidv4 } from "zod/v4";

const CallVideoChatDialog = ({ user }: { user: User }) => {
	// Define default allowedParams
	const router = useRouter();

	// Navigate to video call page with video+audio enabled
	const startVideoCall = () => {
		const roomId = uuidv4();
		const params = new URLSearchParams({
			micOn: "true",
			camOn: "true",
		});
		router.push(`/video_chat/${roomId}?${params.toString()}`);
	};

	// Navigate to video call page with audio call
	const startCall = () => {
		const roomId = uuidv4();
		const params = new URLSearchParams({
			micOn: "true",
			camOn: "false",
		});
		router.push(`/video_chat/${roomId}?${params.toString()}`);
	};

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<IconWithSVG className="!size-7.5">
					<IoCall className="text-lg" />
				</IconWithSVG>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-165 h-120 scale-95 shadow-lg border border-border
		z-[12000]
			flex flex-col items-center text-center
		"
				>
					<Dialog.Title className="sr-only">DialogBox From calling {user.displayName}</Dialog.Title>
					<Avatar
						parentClassName="mt-10"
						disableTooltip
						id={user.id}
						size={"size-30"}
						fontSize="text-3xl"
						displayName={user.displayName}
						src={user.image ?? ""}
						statusIndicator={false}
					></Avatar>{" "}
					<p className="text-3xl mt-8">{user.displayName}</p>
					<p className="text-base font-normal text-muted mt-1">Click on the camera icon if you want to start a call.</p>
					<div className="flex justify-center gap-2 mt-auto">
						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<IconWithSVG onClick={startVideoCall} className="!rounded-full bg-success hover:bg-success/75">
								<PiVideoCameraFill />
							</IconWithSVG>
							<span className="text-sm text-muted">Start Video</span>
						</div>

						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<Dialog.Close asChild>
								<IconWithSVG className="!rounded-full bg-accent hover:bg-accent/60">
									<HiOutlineX />
								</IconWithSVG>
							</Dialog.Close>
							<span className="text-sm text-muted">Cancel</span>
						</div>

						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<IconWithSVG onClick={startCall} className="!rounded-full bg-success hover:bg-success/75">
								<IoCall />
							</IconWithSVG>
							<span className="text-sm text-muted">Start Call</span>
						</div>
						{/* <button className="btn btn-purple btn-with-icon justify-center items-center gap-2" type="submit">
							Start Video
						</button>
						<Dialog.Close asChild>
							<button className="btn btn-secondary">
								<HiOutlineX className="text-lg" />
								Cancel
							</button>
						</Dialog.Close>
						<button className="btn btn-purple btn-with-icon justify-center items-center gap-2" type="submit">
							<IoCall className="text-lg" />
							Start Call
						</button> */}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
