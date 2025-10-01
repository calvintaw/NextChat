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

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

const ChatMessages = ({ messages }: { messages: MessageType[] }) => {
	const { isBlocked, isSystem } = useChatProvider();

	// relative min-h-[calc(100vh-400px)] h-full
	return (
		<div className={clsx("flex-1 flex flex-col relative")}>
			{isBlocked && (
				<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
					<div className="bg-accent text-text px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90vw] mx-3">
						<HiExclamationCircle size={20} />
						<span>You cannot send messages in this chat</span>
					</div>
				</div>
			)}

			{isSystem && (
				<div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
					<div className="bg-accent text-text px-4 py-2 rounded-lg flex items-center gap-2 max-w-[90vw] mx-3">
						<HiExclamationCircle size={20} />
						<span>Our AI assistant isn’t available right now — looks like the server is out of credits.</span>
					</div>
				</div>
			)}

			{!isBlocked &&
				messages.map((msg, i) => {
					const prevMsg = i - 1 >= 0 ? messages[i - 1] : null;
					const isFirstGroup =
						i % 7 === 0 ||
						(!!prevMsg && prevMsg.sender_id !== msg.sender_id) ||
						(!!prevMsg && dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "minute") >= 5);
					const separateLogic = prevMsg && dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "day") >= 1;

					return (
						<React.Fragment key={msg.id}>
							{separateLogic && <MessageSeparator date={msg.createdAt} />}

							<MessageCard msg={msg} key={msg.id} isFirstGroup={isFirstGroup}></MessageCard>
						</React.Fragment>
					);
				})}
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
		// "100px tolerance" for near-bottom

		if (isAtBottom || isFocused()) {
			scrollRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	return <span ref={scrollRef}></span>;
};

const MessageSeparator = ({ date }: { date: string }) => {
	return (
		<div className="flex items-center my-1">
			<hr className="flex-1 border-t border-muted/15" />
			<span className="px-3 text-[10px] text-muted uppercase tracking-wide whitespace-nowrap">
				{dayjs(date).format("MMMM D, YYYY")}
			</span>
			<hr className="flex-1 border-t border-muted/15" />
		</div>
	);
};

export default ChatMessages;
