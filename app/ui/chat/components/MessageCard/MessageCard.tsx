"use client";
import TextareaAutosize from "react-textarea-autosize";

type MessageCardType = {
	msg: MessageType;
	isFirstGroup: boolean;
	arr_index: number;
};

const MessageCard = ({ msg, isFirstGroup, arr_index }: MessageCardType) => {
	const msg_date_short = dayjs(msg.createdAt).format("h:mm A");
	const msg_date =
		dayjs().diff(dayjs(msg.createdAt), "day") < 1 ? msg_date_short : dayjs(msg.createdAt).format("M/D/YYYY, h:mm A");

	const editInputRef = useRef<HTMLTextAreaElement | null>(null);
	const { msgToEdit, messages, setMessages, setMsgToEdit, roomId, replyToMsg, user, recipient } = useChatProvider();
	const toast = useToast();

	const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setMsgToEdit(null);

		const formData = new FormData(e.currentTarget as HTMLFormElement);
		const newContent = formData.get("edit")?.toString().trim() ?? "";

		if (!newContent) return;

		const originalMsgs = [...messages];

		// local update
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((msg) => msg.id === msgToEdit);
			if (index === -1) return prev;

			if (!newContent) return prev;

			const updatedMessages = [...prev];

			updatedMessages[index] = {
				...updatedMessages[index],
				content: newContent,
				type: includeLinks(newContent) ? "link" : updatedMessages[index].type,
				edited: true,
			};

			return updatedMessages;
		});

		const result = await editMsg({ userId: user.id, id: msg.id, roomId, content: newContent });
		if (!result.success) {
			setMessages(originalMsgs);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
			console.log(result.error);
		}
	};

	let replyBlock = null;
	if (msg.replyTo) {
		const repliedMsg = messages.find((m: MessageType) => m.id === msg.replyTo);
		const reply_img_url = repliedMsg?.sender_image ?? "";
		const reply_displayName = repliedMsg?.sender_display_name ?? "";
		const reply_content = repliedMsg?.content.slice(0, 200) ?? "";

		replyBlock = (
			<div className="flex items-center gap-2 w-full pb-1 group/header">
				<div className="w-12 flex justify-center pl-1 relative ">
					<div className="absolute -top-0.5 right-0">
						<CornerSVG></CornerSVG>
					</div>
				</div>
				<div className="flex items-center gap-1 text-sm font-extralight font-chunk">
					<Avatar
						size="size-5"
						fontSize="text-xs"
						id={msg.replyTo}
						src={reply_img_url}
						statusIndicator={false}
						displayName={reply_displayName}
						parentClassName=" ml-1 text-xs relative top-0.25"
					/>
					<Link
						className="no-underline decoration-0 "
						title={`Go to ${reply_displayName}'s Profile`}
						href={`/users/${msg.replyTo}`}
					>
						<span className="text-muted">@{reply_displayName}</span>
					</Link>{" "}
					<a
						href={`#${msg.replyTo}`}
						onClick={(e) => {
							e.preventDefault();
							const el = document.getElementById(msg.replyTo!);
							if (el) {
								el.scrollIntoView({
									behavior: "smooth",
									block: "center",
									inline: "nearest",
								});
							}
						}}
						className="no-underline decoration-0  text-text/90 font-extralight cursor-pointer whitespace-pre-wrap"
					>
						{reply_content}
					</a>
				</div>
			</div>
		);
	}

	useEffect(() => {
		if (msgToEdit && editInputRef.current) {
			editInputRef.current.focus();
		}
	}, [msgToEdit]);

	// fn for resending the msg to db if the original operation fails
	const retrySendingMessage = async (msg: MessageType) => {
		setMessages((prev: MessageType[]) =>
			prev.map((prevMsg) => (prevMsg.id === msg.id ? { ...prevMsg, synced: "pending" } : prevMsg))
		);
		// frequent changing of react state is hurting performance I think
		// TODO: maybe find a way to boost performance
		const result = await insertMessageInDB({ room_id: roomId, ...msg });
		if (!result.success && result.message) {
			toast({ title: result.message, subtitle: "", mode: "negative" });
			setMessages((prev: MessageType[]) =>
				prev.map((prevMsg) => (prevMsg.id === msg.id ? { ...prevMsg, synced: false } : prevMsg))
			);
		} else if (result.success) {
			setMessages((prev: MessageType[]) =>
				prev.map((prevMsg) => (prevMsg.id === msg.id ? { ...prevMsg, synced: true } : prevMsg))
			);
		}
	};

	const [linkExpired, ___toggleLink] = useState(() => {
		if (msg.type !== "video-call") return false;
		return msg.link_expired ?? dayjs().diff(dayjs(JSON.parse(msg.content)[1]), "minute") >= 3;
	});

	return (
		<div
			id={msg.id}
			className={clsx(
				"flex flex-col w-full dark:hover:bg-background/75 hover:bg-accent/75 px-2 pl-3 py-1.5  relative ",
				msgToEdit === msg.id ? "dark:bg-background/75 bg-accent" : "group",
				msg.type === "image" || msg.type === "video" ? "pb-1 pt-3" : "max-sm:pb-1",
				isFirstGroup && arr_index > 0 && "mt-2",
				replyToMsg &&
					replyToMsg.id === msg.id &&
					"bg-primary/20 border-3 border-b-0 border-t-0 border-primary hover:!bg-primary/10"
			)}
		>
			{replyBlock}

			<div className="flex items-start gap-2">
				{(isFirstGroup || msg.replyTo) && (
					<div className="min-w-11 flex justify-center max-sm:hidden">
						<Avatar
							size="size-9"
							id={msg.sender_id}
							src={msg.sender_image}
							statusIndicator={false}
							displayName={msg.sender_display_name}
							parentClassName="mt-1 cursor-pointer"
						></Avatar>
					</div>
				)}
				<div className="flex flex-1 flex-col justify-center">
					{/* User Name and MSG sent time */}
					{(isFirstGroup || msg.replyTo) && (
						// removed mb-1
						<div className="text-sm text-muted flex items-center gap-2 mb-1">
							<Avatar
								size="size-7"
								id={msg.sender_id}
								src={msg.sender_image}
								statusIndicator={false}
								fontSize="text-xs"
								displayName={msg.sender_display_name}
								parentClassName="mt-1 cursor-pointer min-sm:hidden"
							></Avatar>
							<Link
								className="no-underline decoration-0  font-semibold text-foreground hover:underline hover:cursor-pointer"
								title={`Go to ${msg.sender_display_name}'s Profile`}
								href={`/users/${msg.sender_id}`}
							>
								{msg.sender_display_name}
							</Link>
							{isRoom(recipient) && recipient.owner_id === msg.sender_id && (
								<span
									className="-ml-0.5 py-0.5 px-1.5 text-xs rounded-lg text-yellow-400 bg-primary/50 not-dark:bg-foreground
								
								flex items-center gap-0.5
								"
								>
									<FaCrown className="text-xs"></FaCrown>owner
								</span>
							)}

							<span className="text-[11px]">{msg_date}</span>
						</div>
					)}
					{/* Message bubble */}
					<div className="flex gap-4 max-sm:gap-x-3 h-fit -mb-1">
						{!isFirstGroup && !msg.replyTo && (
							<>
								<div
									className="max-sm:hidden 
								w-9 h-auto font-mono text-center whitespace-nowrap text-nowrap flex items-center justify-center pl-0.5 text-[10px] text-muted -z-50 group-hover:z-0"
								>
									<p className="mt-0.5">{msg_date_short}</p>
								</div>
								<div className="min-sm:hidden"></div>
							</>
						)}

						{(msg.type === "text" || msg.type === "video-call" || msg.type === "link") &&
							(msgToEdit !== msg.id ? (
								<div className="w-full flex max-sm:justify-between relative">
									<div
										className={clsx(
											//added bg
											"relative max-w-full break-words  text-sm",
											isFirstGroup && "max-sm:pl-3 max-sm:mt-1"
										)}
									>
										<Tooltip
											id={`message-card-icons-tooltip`}
											place="top"
											className="small-tooltip"
											border="var(--tooltip-border)"
											offset={0}
										/>
										{msg.type === "text" ? (
											<p className="whitespace-pre-wrap !max-w-[100ch]">{msg.content}</p>
										) : msg.type === "link" ? (
											<p className="whitespace-pre-wrap">{renderLinks(msg.content)}</p>
										) : (
											<JoinVideoCallCard
												name={msg.sender_display_name}
												link_expired={linkExpired}
												roomId={roomId}
												id={msg.id}
												content={msg.content}
											/>
										)}{" "}
										{msg.edited && (
											<span className="text-[11px] tracking-wide text-muted relative top-[1px]">{"(edited)"}</span>
										)}
									</div>
									<div
										className={clsx(
											// IMPORTANT Removed h-full
											"min-sm:hidden shrink-0 relative w-fit h-fit font-mono text-center whitespace-nowrap text-nowrap flex items-center justify-center text-[11px] text-muted -z-50 group-hover:z-0 								",
											isFirstGroup ? "-top-5 h-fit !items-start" : "!items-end self-end top-1"
										)}
									>
										{!isFirstGroup ? msg_date_short : null}{" "}
										{((typeof msg.synced === "boolean" && msg.synced) ||
											// msg is from server, then synced is undefine as there is no such column as synced on DB
											typeof msg.synced === "undefined") &&
											msg.sender_id === user.id && <>{isFirstGroup ? "sent ✅" : "✅"}</>}
										{typeof msg.synced === "boolean" && !msg.synced && msg.sender_id === user.id && "❌"}
										{msg.synced === "pending" && msg.sender_id === user.id && "⌛"}
									</div>

									{typeof msg.synced === "undefined" && msg.sender_id === user.id && (
										<>
											<p className={clsx("msg-synced-indicator self-end border-red-500")}>sent ✅</p>
										</>
									)}
									{/* 
									{msg.synced && msg.sender_id === user.id && (
										<>
											<div
												className={clsx("msg-synced-indicator", !isFirstGroup ? "!bottom-0" : "border-red-500 border ")}
											>
												<p>2
													{typeof msg.synced === "boolean" && msg.synced && "sent ✅"}
													{typeof msg.synced === "boolean" && !msg.synced && "failed ❌"}
													{msg.synced === "pending" && "sending ⌛"}
												</p>
												{typeof msg.synced === "boolean" && !msg.synced && (
													<IconWithSVG
														data-tooltip-id="icon-message-dropdown-menu-id"
														data-tooltip-content="Retry"
														onClick={() => retrySendingMessage(msg)}
														className="icon-small ml-1"
													>
														<AiOutlineReload />
													</IconWithSVG>
												)}
											</div>
										</>
									)} */}
								</div>
							) : (
								<form onSubmit={handleEditSubmit} className="w-full flex flex-col gap-1 relative">
									<TextareaAutosize
										ref={editInputRef}
										name="edit"
										className="form-textarea_custom !p-1 !px-2 !rounded-md"
										defaultValue={msg.content}
										// onKeyDown={(e) => {
										// 	if (e.key === "Enter") {
										// 		e.preventDefault();
										// 		e.currentTarget.form?.requestSubmit();
										// 	}
										// }}
									/>
									<div className="h-fit flex gap-1 self-end">
										<button
											type="button"
											className="btn-secondary text-sm opacity-75 hover:opacity-100"
											onClick={() => setMsgToEdit(null)}
										>
											Cancel
										</button>
										<button type="submit" className="bg-primary text-sm text-white hover:bg-primary/75">
											Save
										</button>
									</div>
								</form>
							))}

						{msg.type === "audio" && <VoiceMessage url={msg.content}></VoiceMessage>}

						{(msg.type === "image" || msg.type === "video") && (
							<div
								className={clsx(
									"max-w-105 w-full grid gap-2 rounded-md img-upload-scrollbar relative",
									isFirstGroup && "max-sm:mt-2 max-sm:pl-3"
								)}
							>
								{JSON.parse(msg.content).map((src: string, i: number) => {
									const isEven = JSON.parse(msg.content).length % 2 === 0;
									const total = JSON.parse(msg.content).length;

									// if only 1 item in array, take full width
									const colSpan = total === 1 ? 4 : !isEven && i === 0 ? 2 : 1; // even ? then all images have 1x1, if not even, give 1st img 2x2 and then rest 1x1
									const rowSpan = total === 1 ? 2 : !isEven && i === 0 ? 2 : 1;

									return (
										<div
											key={`${src}-${i}-${msg.id}`}
											className="rounded-2xl w-full max-h-65 flex items-center justify-center bg-accent"
											style={{
												gridColumn: `span ${colSpan}`,
												gridRow: `span ${rowSpan}`,
											}}
										>
											{msg.type === "image" ? (
												<ImgCard src={src}></ImgCard>
											) : (
												<video
													src={src}
													controls
													muted
													loop
													className="w-full h-full aspect-square object-cover rounded-lg"
												/>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
					<ReactionsRow msg={msg} isFirstGroup={isFirstGroup}></ReactionsRow>
					{(msg.type == "image" || msg.type == "video") && (
						<div className={clsx("max-sm:right-4 flex gap-1 items-center justify-end")}>
							<div
								className={clsx(
									" shrink-0 w-fit -z-50 h-fit font-mono text-center whitespace-nowrap text-nowrap flex items-center justify-center text-[11px] text-muted group-hover:z-0",
									isFirstGroup && "justify-end"
								)}
							>
								{!isFirstGroup && <span className="min-sm:hidden mr-[1ch]">{msg_date_short} </span>}
								{((typeof msg.synced === "boolean" && msg.synced) || typeof msg.synced === "undefined") &&
									msg.sender_id === user.id && (
										<>
											{isFirstGroup ? (
												"sent ✅"
											) : (
												<span>
													<span className="max-sm:hidden">sent </span>✅
												</span>
											)}
										</>
									)}
								{typeof msg.synced === "boolean" && !msg.synced && msg.sender_id === user.id && "❌"}
								{msg.synced === "pending" && msg.sender_id === user.id && "⌛"}
							</div>

							{/* <div className="msg-synced-indicator bg-red-500 border z-100 ml-10">
								<p>
									{typeof msg.synced === "boolean" && msg.synced && "sent ✅"}
									{typeof msg.synced === undefined && msg.sender_id === user.id && "sent ✅"}
									{typeof msg.synced === "boolean" && !msg.synced && "failed ❌"}
									{msg.synced === "pending" && "sending ⌛"}
								</p>
								{typeof msg.synced === "boolean" && !msg.synced && (
									<IconWithSVG
										data-tooltip-id="icon-message-dropdown-menu-id"
										data-tooltip-content="Retry"
										onClick={() => retrySendingMessage(msg)}
										className="icon-small ml-1"
									>
										<AiOutlineReload />
									</IconWithSVG>
								)}
							</div> */}
						</div>
					)}
				</div>
			</div>

			{!(roomId.startsWith("system-room") && msg.sender_id !== user.id) && (
				<MessageDropdownMenu retrySendingMessage={retrySendingMessage} msg={msg}></MessageDropdownMenu>
			)}
		</div>
	);
};

export default MessageCard;

const ImgCard = ({ src }: { src: string }) => {
	const [loaded, setLoaded] = useState(false);

	return (
		<img
			onLoad={() => {
				setLoaded(true);
			}}
			src={src}
			alt="Uploaded preview"
			className={clsx(
				"w-full h-full aspect-square object-cover rounded-lg transition-all duration-500",
				!loaded && "blur-md scale-95",
				loaded && "blur-0 scale-100"
			)}
		/>
	);
};

const CornerSVG = () => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 30 20"
			width="35"
			height="15"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="text-muted/50 group-hover/header:text-text transition-colors duration-200"
		>
			<path d="M2 18 V4 C2 3.4477 2.4477 3 3 3 H40" />
		</svg>
	);
};

const JoinVideoCallCard = ({
	link_expired,
	id,
	content,
	roomId,
	name,
}: {
	name: string;
	link_expired?: boolean;
	id: string;
	content: string;
	roomId: string;
}) => {
	const [videoChatLink, videoChatLinkCreatedAt] = JSON.parse(content);
	const local_is_expired = link_expired;
	const [expired, setExpired] = useState(local_is_expired);

	const channel = React.useMemo(() => {
		if (local_is_expired) return null;
		return supabase.channel(`room:${roomId}`);
	}, [roomId]);

	useEffect(() => {
		if (expired) return;
		const interval = setInterval(() => {
			setExpired(dayjs().diff(dayjs(videoChatLinkCreatedAt), "minute") >= 3);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (expired && channel) {
			channel.send({
				type: "broadcast",
				event: "link_expired",
				payload: { id },
			});
		}
	}, [expired]);

	return (
		<div className=" border-contrast border px-3 py-2 rounded-2xl dark:bg-background/75 bg-primary/10 flex flex-wrap items-center gap-1.5">
			<p>{name} started a video call.</p>

			{expired ? (
				<button
					disabled={expired}
					className="text-xs px-2 py-0.5 rounded-full text-white bg-red-500 not-dark:bg-red-400 cursor-not-allowed"
				>
					Expired
				</button>
			) : (
				<Link className={"no-underline decoration-0 "} href={videoChatLink}>
					<button className={clsx("text-xs px-2 py-0.5 rounded-full text-white", "bg-green-600 not-dark:bg-green-500")}>
						Join Call
					</button>
				</Link>
			)}
		</div>
	);
};

import { FaCrown } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import { supabase } from "@/app/lib/supabase";
//@ts-ignore
import extractUrls from "extract-urls";
import { MdDone } from "react-icons/md";
import { editMsg, insertMessageInDB, removeReactionFromMSG, getUsername } from "@/app/lib/actions";
import { MessageType } from "@/app/lib/definitions";
import { useToast } from "@/app/lib/hooks/useToast";
import { includeLinks, isRoom, URL_REGEX_ADVANCED, SHORT_URL_REGEX, extractFilePath } from "@/app/lib/utilities";
import { Avatar } from "@/app/ui/general/Avatar";
import clsx from "clsx";
import dayjs from "dayjs";
import Link from "next/link";
import React, { useRef, useEffect, useState } from "react";
import { useChatProvider } from "../../ChatBoxWrapper";
import { MessageDropdownMenu } from "./MessageDropdown";
import { ReactionsRow } from "./MessageReactionsBar";

// regex codes are written by chatgpt except the one in utilities. src: https://daringfireball.net/2010/07/improved_regex_for_matching_urls
export function renderLinks(text: string) {
	const linksAdvanced: string[] = text.match(URL_REGEX_ADVANCED) || [];
	const linksShort: string[] = text.match(SHORT_URL_REGEX) || [];
	const links: string[] = extractUrls(text, true) || [];
	const mergedLinks = Array.from(new Set([...links, ...linksAdvanced, ...linksShort]));

	if (mergedLinks.length === 0) return [text];

	// Sort by index in text to prevent overlaps
	const positions: { start: number; end: number; url: string }[] = [];
	for (let i = 0; i < mergedLinks.length; i++) {
		const url = mergedLinks[i];
		const startIndex = text.indexOf(url);
		if (startIndex !== -1) {
			positions.push({ start: startIndex, end: startIndex + url.length, url });
		}
	}

	// Sort by start index
	positions.sort((a, b) => a.start - b.start);

	const result: React.ReactNode[] = [];
	let cursor = 0;

	for (let i = 0; i < positions.length; i++) {
		const { start, end, url } = positions[i];

		if (start > cursor) {
			result.push(text.slice(cursor, start));
		}

		result.push(
			<a
				key={i}
				href={url.startsWith("http") ? url : `https://${url}`}
				target="_blank"
				rel="noopener noreferrer"
				className="not-dark:text-primary text-blue-400 no-underline decoration-0  hover:underline break-all"
			>
				{url}
			</a>
		);

		cursor = end;
	}

	if (cursor < text.length) {
		result.push(text.slice(cursor));
	}

	return result;
}

// const VoiceMessage = ({ url }: { url: string }) => {
// 	return (
// 		// <audio controls>
// 		// 	<source src={url} type="audio/webm" />
// 		// 	Your browser does not support the audio element.
// 		// </audio>
// 		<div className=" border-contrast border px-2 py-1.5 rounded-full dark:bg-background/75 bg-primary/10 flex flex-wrap items-center gap-2">
// 			<IconWithSVG className="icon-small !rounded-full !bg-primary hover:!bg-primary/75">
// 				<IoIosPlay className="text-white"></IoIosPlay>
// 			</IconWithSVG>
// 			<LuAudioLines className="text-2xl mr-1"></LuAudioLines>
// 			<span className="text-sm">0:33</span>
// 			<IconWithSVG className="icon-small !rounded-full">
// 				<HiSpeakerWave className="text-lg"></HiSpeakerWave>
// 			</IconWithSVG>
// 		</div>
// 	);
// };

import { IconWithSVG } from "@/app/ui/general/Buttons";
import { HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { IoIosPause, IoIosPlay } from "react-icons/io";
import { LuAudioLines } from "react-icons/lu";

// const formatTime = (time: number) => {
// 	const minutes = Math.floor(time / 60);
// 	const seconds = Math.floor(time % 60);
// 	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
// };

// const VoiceMessage = ({ url }: { url: string }) => {
// 	const audioRef = useRef<HTMLAudioElement>(new Audio(url));
// 	const [isPlaying, setIsPlaying] = useState(false);
// 	const [currentTime, setCurrentTime] = useState(0);
// 	const [duration, setDuration] = useState(0);
// 	const [volume, setVolume] = useState(1);

// 	// Sync audio element
// 	useEffect(() => {
// 		const audio = audioRef.current;

// 		const onLoadedMetadata = () => setDuration(audio.duration);
// 		const onTimeUpdate = () => setCurrentTime(audio.currentTime);
// 		audio.addEventListener("loadedmetadata", onLoadedMetadata);
// 		audio.addEventListener("timeupdate", onTimeUpdate);

// 		return () => {
// 			audio.removeEventListener("loadedmetadata", onLoadedMetadata);
// 			audio.removeEventListener("timeupdate", onTimeUpdate);
// 			audio.pause();
// 		};
// 	}, [url]);

// 	const togglePlay = () => {
// 		const audio = audioRef.current;
// 		if (isPlaying) {
// 			audio.pause();
// 		} else {
// 			audio.play();
// 		}
// 		setIsPlaying(!isPlaying);
// 	};

// 	const toggleMute = () => {
// 		const audio = audioRef.current;
// 		if (volume > 0) {
// 			setVolume(0);
// 			audio.volume = 0;
// 		} else {
// 			setVolume(1);
// 			audio.volume = 1;
// 		}
// 	};

// 	return (
// 		<div className="border-contrast border px-2 py-1.5 rounded-full dark:bg-background/75 bg-primary/10 flex flex-wrap items-center gap-2">
// 			<IconWithSVG className="icon-small !rounded-full !bg-primary hover:!bg-primary/75" onClick={togglePlay}>
// 				{isPlaying ? <IoIosPause className="text-white" /> : <IoIosPlay className="text-white" />}
// 			</IconWithSVG>

// 			<LuAudioLines className="text-2xl mr-1" />

// 			<span className="text-sm">
// 				{formatTime(currentTime)} / {formatTime(duration)}
// 			</span>

// 			<IconWithSVG className="icon-small !rounded-full" onClick={toggleMute}>
// 				{volume > 0 ? <HiSpeakerWave className="text-lg" /> : <HiSpeakerXMark className="text-lg" />}
// 			</IconWithSVG>
// 		</div>
// 	);
// };

// const formatTime = (time: number) => {
// 	const minutes = Math.floor(time / 60);
// 	const seconds = Math.floor(time % 60);
// 	return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}`;
// };

// const VoiceMessage = ({ url }: { url: string }) => {
// 	const audioRef = useRef<HTMLAudioElement>(new Audio(url));
// 	const [isPlaying, setIsPlaying] = useState(false);
// 	const [currentTime, setCurrentTime] = useState(0);
// 	const [duration, setDuration] = useState(0);
// 	const [volume, setVolume] = useState(1);

// 	useEffect(() => {
// 		const audio = audioRef.current;

// 		const onLoadedMetadata = () => setDuration(audio.duration);
// 		const onTimeUpdate = () => setCurrentTime(audio.currentTime);

// 		audio.addEventListener("loadedmetadata", onLoadedMetadata);
// 		audio.addEventListener("timeupdate", onTimeUpdate);

// 		return () => {
// 			audio.removeEventListener("loadedmetadata", onLoadedMetadata);
// 			audio.removeEventListener("timeupdate", onTimeUpdate);
// 			audio.pause();
// 		};
// 	}, [url]);

// 	const togglePlay = () => {
// 		const audio = audioRef.current;
// 		if (isPlaying) {
// 			audio.pause();
// 		} else {
// 			audio.play();
// 		}
// 		setIsPlaying(!isPlaying);
// 	};

// 	const toggleMute = () => {
// 		const audio = audioRef.current;
// 		if (volume > 0) {
// 			setVolume(0);
// 			audio.volume = 0;
// 		} else {
// 			setVolume(1);
// 			audio.volume = 1;
// 		}
// 	};

// 	const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
// 		const audio = audioRef.current;
// 		const newTime = Number(e.target.value);
// 		audio.currentTime = newTime;
// 		setCurrentTime(newTime);
// 	};

// 	return (
// 		<div className="border-contrast border px-2 py-1.5 rounded-full dark:bg-background/75 bg-primary/10 flex flex-wrap items-center gap-2">
// 			{/* Play/Pause Button */}
// 			<IconWithSVG className="icon-small !rounded-full !bg-primary hover:!bg-primary/75" onClick={togglePlay}>
// 				{isPlaying ? <IoIosPause className="text-white" /> : <IoIosPlay className="text-white" />}
// 			</IconWithSVG>

// 			{/* Audio Icon */}
// 			<LuAudioLines className="text-2xl mr-1" />

// 			{/* Time Display */}
// 			<span className="text-sm">
// 				{formatTime(currentTime)} / {formatTime(duration)}
// 			</span>

// 			{/* Slider */}
// 			<input
// 				type="range"
// 				min={0}
// 				max={duration || 0}
// 				value={currentTime}
// 				onChange={handleSliderChange}
// 				className="flex-1 h-1 rounded-lg accent-primary"
// 			/>

// 			{/* Volume Control */}
// 			<IconWithSVG className="icon-small !rounded-full" onClick={toggleMute}>
// 				{volume > 0 ? <HiSpeakerWave className="text-lg" /> : <HiSpeakerXMark className="text-lg" />}
// 			</IconWithSVG>
// 		</div>
// 	);
// };

import WaveSurfer from "wavesurfer.js";

// Time formatter: minutes:seconds, only shows minutes if audio > 1 min
const formatTime = (time: number) => {
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : `${seconds}`;
};

const VoiceMessage = ({ url }: { url: string }) => {
	const waveContainerRef = useRef<HTMLDivElement | null>(null);
	const waveRef = useRef<WaveSurfer | null>(null);

	const [isPlaying, setIsPlaying] = useState(false);
	const [volume, setVolume] = useState(1);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	// Initialize WaveSurfer
	useEffect(() => {
		if (!waveContainerRef.current) return;

		const wave = WaveSurfer.create({
			container: waveContainerRef.current,
			waveColor: "#d1d5db", // same as light gray
			progressColor: "#3b82f6", // blue progress
			cursorColor: "#2563eb", // cursor color
			barWidth: 2,
			height: 40,
		});

		wave.load(url);
		waveRef.current = wave;

		// Update duration when loaded
		wave.on("ready", () => setDuration(wave.getDuration()));

		// Update current time as audio plays
		wave.on("audioprocess", () => setCurrentTime(wave.getCurrentTime()));

		// Sync isPlaying when finished
		wave.on("finish", () => setIsPlaying(false));

		return () => wave.destroy();
	}, [url]);

	const togglePlay = () => {
		if (!waveRef.current) return;
		waveRef.current.playPause();
		setIsPlaying(!isPlaying);
	};

	const toggleMute = () => {
		if (!waveRef.current) return;
		if (volume > 0) {
			waveRef.current.setVolume(0);
			setVolume(0);
		} else {
			waveRef.current.setVolume(1);
			setVolume(1);
		}
	};

	// return (
	// 	<div className="border-contrast border px-2 py-1.5 rounded-full dark:bg-background/75 bg-primary/10 flex flex-col gap-2">
	// 		<div className="flex items-center gap-2">
	// 			<IconWithSVG className="icon-small !rounded-full !bg-primary hover:!bg-primary/75" onClick={togglePlay}>
	// 				{isPlaying ? <IoIosPause className="text-white" /> : <IoIosPlay className="text-white" />}
	// 			</IconWithSVG>

	// 			<div ref={waveContainerRef} className="w-full h-10 cursor-pointer" />

	// 			<span className="text-sm">
	// 				{formatTime(currentTime)} / {formatTime(duration)}
	// 			</span>

	// 			<IconWithSVG className="icon-small !rounded-full" onClick={toggleMute}>
	// 				{volume > 0 ? <HiSpeakerWave className="text-lg" /> : <HiSpeakerXMark className="text-lg" />}
	// 			</IconWithSVG>
	// 		</div>

	// 	</div>
	// );

	return (
		// <div className="border-contrast border px-2 py-1.5 rounded-full dark:bg-background/75 bg-primary/10 flex items-center gap-2">
		// 	{/* Play button */}
		// 	<IconWithSVG className="icon-small !rounded-full !bg-primary hover:!bg-primary/75" onClick={togglePlay}>
		// 		{isPlaying ? <IoIosPause className="text-white" /> : <IoIosPlay className="text-white" />}
		// 	</IconWithSVG>

		// 	{/* Waveform fills the middle */}
		// 	<div ref={waveContainerRef} className="flex-1 h-10 cursor-pointer" />

		// 	{/* Time display */}
		// 	<span className="text-sm">
		// 		{formatTime(currentTime)} / {formatTime(duration)}
		// 	</span>

		// 	{/* Volume button */}
		// 	<IconWithSVG className="icon-small !rounded-full" onClick={toggleMute}>
		// 		{volume > 0 ? <HiSpeakerWave className="text-lg" /> : <HiSpeakerXMark className="text-lg" />}
		// 	</IconWithSVG>
		// </div>
		<audio src={url} controls className="!rounded-full"></audio>
		// <AudioPlayer src={url} color="#cfcfcf" sliderColor="#94b9ff" backgroundColor="#2c2828" />
	);
};

import { AudioPlayer } from "react-audio-play";
