"use client";
import { getLocalTimeString } from "@/app/lib/utilities";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import { Avatar } from "../../general/Avatar";
import { MessageType } from "@/app/lib/definitions";
import { useChatProvider } from "../ChatBoxWrapper";
import InputField from "../../form/InputField";
import { MessageDropdownMenu } from "./MessageDropdown";
import { addReactionToMSG, editMsg, getUsername, removeReactionFromMSG } from "@/app/lib/actions";
import { HiArrowTurnUpRight } from "react-icons/hi2";
import { flushSync } from "react-dom";
import { useToast } from "@/app/lib/hooks/useToast";
import { RxCross1, RxCross2 } from "react-icons/rx";
import { IconWithSVG } from "../../general/Buttons";

type MessageCardType = {
	msg: MessageType;
	isFirstGroup: boolean;
	onDelete: (id: string) => void;
};

const MessageCard = ({ msg, isFirstGroup, onDelete }: MessageCardType) => {
	const msg_date = getLocalTimeString(msg.createdAt);
	const editInputRef = useRef<HTMLInputElement | null>(null);
	const { msgToEdit, messages, setMessages, setMsgToEdit, roomId, replyToMsg } = useChatProvider();
	const toast = useToast();

	useEffect(() => {
		console.log("MSG TO EDIT ID:", msgToEdit);
	}, [msgToEdit]);

	const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setMsgToEdit(null);

		const formData = new FormData(e.currentTarget as HTMLFormElement);
		const newContent = formData.get("edit")?.toString().trim() ?? "";

		if (!newContent) return;

		const originalMsgs = [...messages];
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((msg) => msg.id === msgToEdit);
			if (index === -1) return prev;

			if (!newContent) return prev;

			const updatedMessages = [...prev];
			updatedMessages[index] = {
				...updatedMessages[index],
				content: newContent,
				edited: true,
			};

			return updatedMessages;
		});

		const result = await editMsg({ id: msg.id, roomId, content: newContent });
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
					{/* <svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 12"
						width="20"
						height="12"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M2 10 V4 C2 3.4477 2.4477 3 3 3 H18" />
					</svg> */}
				</div>
				<div className="flex items-center gap-1 text-sm font-extralight font-chunk">
					<Avatar
						size="size-4.5"
						id={msg.replyTo}
						src={reply_img_url}
						statusIndicator={false}
						displayName={reply_displayName}
					/>
					<span className="text-muted">@{reply_displayName}</span>{" "}
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
						className="no-underline text-text/90 font-extralight cursor-pointer"
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

	return (
		<div
			data-image-url={msg.sender_image}
			data-displayname={msg.sender_display_name}
			data-content={msg.content.slice(0, 200)}
			id={msg.id}
			className={clsx(
				"flex flex-col w-full dark:hover:bg-background/75 hover:bg-accent/75 px-2 pl-3 py-2 relative",
				msgToEdit === msg.id ? "dark:bg-background/75 bg-accent" : "group",

				replyToMsg &&
					replyToMsg.id === msg.id &&
					"bg-primary/20 border-3 border-b-0 border-t-0 border-primary hover:!bg-primary/10"
			)}
		>
			{replyBlock}

			<div className="flex items-start gap-4 max-w-[95%]">
				{(isFirstGroup || msg.replyTo) && (
					<div className="min-w-11 flex justify-center">
						<Avatar
							size="size-10"
							id={msg.sender_id}
							src={msg.sender_image}
							statusIndicator={false}
							displayName={msg.sender_display_name}
						></Avatar>
					</div>
				)}
				<div className="flex flex-1 flex-col">
					{/* User Name and MSG sent time */}
					{(isFirstGroup || msg.replyTo) && (
						<div className="text-sm text-muted flex items-center gap-2 mb-1">
							<p className="font-semibold text-foreground hover:underline hover:cursor-pointer">
								{msg.sender_display_name}
							</p>
							<span className="text-xs">{msg_date}</span>
						</div>
					)}
					{/* Message bubble */}
					<div className={clsx("flex gap-4")}>
						{!isFirstGroup && !msg.replyTo && (
							<div
								className="w-11 h-auto font-mono text-center whitespace-nowrap text-nowrap flex items-center justify-center text-[11px] text-muted -z-50 group-hover:z-0"
								title={getLocalTimeString(msg.createdAt, { hour: "numeric", minute: "numeric", hour12: true })}
							>
								{getLocalTimeString(msg.createdAt, { hour: "numeric", minute: "numeric", hour12: true })}
							</div>
						)}

						{msg.type === "text" &&
							(msgToEdit !== msg.id ? (
								<div className="relative max-w-full break-words break-all whitespace-pre-wrap text-sm">
									{msg.content}{" "}
									{msg.edited && (
										<span className="text-[11px] tracking-wide text-muted relative top-[1px]">{"(edited)"}</span>
									)}
								</div>
							) : (
								<form onSubmit={handleEditSubmit} className="w-full">
									<InputField
										ref={editInputRef}
										name="edit"
										defaultValue={msg.content}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												e.currentTarget.form?.requestSubmit();
											}
										}}
										place="right"
										icon={
											<IconWithSVG className="icon-small" onClick={() => setMsgToEdit(null)}>
												<RxCross2 />
											</IconWithSVG>
										}
									/>
								</form>
							))}

						{(msg.type === "image" || msg.type === "video") && (
							<div className="max-w-100 grid gap-2 rounded-md img-upload-scrollbar">
								{JSON.parse(msg.content).map((src: string, i: number) => {
									const isEven = JSON.parse(msg.content).length % 2 === 0;
									const total = JSON.parse(msg.content).length;

									// if only 1 item in array, take full width
									const colSpan = total === 1 ? 4 : !isEven && i === 0 ? 2 : 1; // even ? then all images have 1x1, if not even, give 1st img 2x2 and then rest 1x1
									const rowSpan = total === 1 ? 2 : !isEven && i === 0 ? 2 : 1;

									return (
										<div
											key={`${src}-${i}`}
											className="rounded-lg max-h-56 flex items-center justify-center bg-accent"
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
				</div>
			</div>

			<MessageDropdownMenu msg={msg} onDelete={onDelete}></MessageDropdownMenu>
		</div>
	);
};

export default MessageCard;

const ReactionsRow = ({ msg, isFirstGroup }: { msg: MessageType; isFirstGroup: boolean }) => {
	const { messages, setMessages, user, roomId } = useChatProvider();
	const [usernamesMap, setUsernamesMap] = useState<Record<string, string>>({});
	const toast = useToast();

	const handleRemoveReaction = async (msg_id: string, emoji: string) => {
		const originalMsg = [...messages];
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((tx) => tx.id === msg_id);
			if (index === -1) return prev;
			const newMsg = [...prev];
			newMsg[index] = {
				...newMsg[index],
				reactions: {
					...newMsg[index].reactions,
					[emoji]: (newMsg[index].reactions[emoji] || []).filter((id) => id !== user.id),
				},
			};
			return newMsg;
		});
		const result = await removeReactionFromMSG({ id: msg_id, roomId, userId: user.id, emoji });
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.error });
		}
	};

	const fetchUsernameIfNeeded = async (userId: string) => {
		if (usernamesMap[userId]) return usernamesMap[userId];
		const result = await getUsername(userId);
		const username = result.success ? result.username : "";
		setUsernamesMap((prev) => ({ ...prev, [userId]: username as string }));
		return username;
	};

	useEffect(() => {
		if (!msg.reactions) return;

		const fetchAll = async () => {
			for (const users of Object.values(msg.reactions)) {
				for (const userId of users) {
					await fetchUsernameIfNeeded(userId);
				}
			}
		};

		fetchAll();
	}, [msg.reactions]);

	if (!msg.reactions) return null;

	return (
		<div className={clsx("mt-1 h-fit w-fit flex gap-1 flex-wrap", !isFirstGroup && !msg.replyTo && "ml-15")}>
			{Object.entries(msg.reactions).map(([emoji, users], idx) => {
				if (users.length === 0) return null;
				return (
					<button
						data-tooltip-id="chatbox-reactions-row-tooltip"
						data-tooltip-content={`Reacted by ${users.map((id) => usernamesMap[id] || "loading...").join(", ")}`}
						key={idx}
						onClick={() => handleRemoveReaction(msg.id, emoji)}
						className="
							flex items-center gap-1 px-1.5 py-[1px]
							rounded-md
							border border-primary
							bg-primary/25
							text-sm
							hover:bg-primary/50
							transition-colors
							select-none
							cursor-pointer
						"
					>
						<span className="text-base">{emoji}</span>
						<span>{users.length}</span>
					</button>
				);
			})}
		</div>
	);
};

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
