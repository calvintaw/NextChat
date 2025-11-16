"use client";
import { MessageContentType, MessageType } from "@/app/lib/definitions";
import React, { useEffect, useRef } from "react";

import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import MessageCard from "./MessageCard";
import { useChatProvider } from "../ChatBoxWrapper";
import { HiExclamationCircle } from "react-icons/hi";
import clsx from "clsx";
import MessageSkeleton from "./MsgCardSkeleton";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

const ChatMessages = ({ messages }: { messages: MessageType[] }) => {
	const { isBlocked, isSystem, isLoadingOldMsg } = useChatProvider();

	return (
		<div
			className={clsx("flex-1 flex flex-col relative", !isBlocked && messages.length === 0 && "pointer-events-none")}
		>
			{isBlocked && (
				<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pt-6">
					<div className="bg-accent text-text px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90vw] mx-3">
						<HiExclamationCircle size={20} />
						<span>You cannot send messages in this chat</span>
					</div>
				</div>
			)}

			{isSystem && isBlocked && (
				<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pt-6">
					<div className="bg-accent text-text px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90vw] mx-3">
						<HiExclamationCircle size={20} />
						<span>Our AI assistant isn’t available right now — looks like the server is out of credits.</span>
					</div>
				</div>
			)}

			{!isBlocked && (
				<>
					{messages.length === 0 && !isLoadingOldMsg ? (
						// <MessageSkeleton count={5} />
						<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none pt-6">
							<div className="bg-accent/30 text-text px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90vw] mx-3">
								<HiOutlineChatBubbleLeftRight size={20} />
								<span>No messages yet — start the conversation!</span>
							</div>
						</div>
					) : (
						messages.map((msg, i) => {
							const prevMsg = i > 0 ? messages[i - 1] : null;
							const isFirstGroup =
								i === 0 ||
								prevMsg?.sender_id !== msg.sender_id ||
								dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "minute") >= 10;

							const separateLogic = prevMsg && dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "day") >= 1;

							return (
								<React.Fragment key={msg.id}>
									{separateLogic && <MessageSeparator date={msg.createdAt} />}
									<MessageCard msg={msg} isFirstGroup={isFirstGroup} arr_index={i} />
								</React.Fragment>
							);
						})
					)}
				</>
			)}

			<RefAnchor></RefAnchor>
		</div>
	);
};

const RefAnchor = () => {
	const { messages, containerRef, textRef } = useChatProvider();
	const scrollRef = useRef<HTMLDivElement>(null);

	const isFocused = (): boolean => {
		return textRef.current === document.activeElement;
	};

	useEffect(() => {
		// container ref is not really needed now as i added a much better solution of check if textarea has focus or cursor in it.
		const container = containerRef.current;
		if (!container) return;

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
		// "100px tolerance" for near-bottom - only activates if user A receives a msg from other users

		if (isAtBottom || isFocused()) {
			scrollRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	return <span ref={scrollRef}></span>;
};

const MessageSeparator = ({ date }: { date: string }) => {
	return (
		<div className="flex items-center my-1">
			<hr className="flex-1 border-t border-muted/15 dark:border-muted/10" />
			<span className="px-3 text-[10px] text-muted tracking-wide whitespace-nowrap capitalize">
				{dayjs(date).format("MMMM D, YYYY")}
			</span>
			<hr className="flex-1 border-t border-muted/15 dark:border-muted/10" />
		</div>
	);
};

export default ChatMessages;
