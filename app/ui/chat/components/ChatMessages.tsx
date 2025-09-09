"use client";
import { MessageType } from "@/app/lib/definitions";
import React, { useLayoutEffect, useRef } from "react";

import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import weekday from "dayjs/plugin/weekday";
import MessageCard from "./MessageCard";
import { useChatProvider } from "../ChatBoxWrapper";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(weekday);

const ChatMessages = ({ messages, deleteMessage }: { messages: MessageType[]; deleteMessage: Function}) => {

	return (
		<>
			{messages.map((msg, i) => {
				const prevMsg = messages[i - 1];
				const isFirstGroup =
					i === 0 ||
					prevMsg.sender_id !== msg.sender_id || prevMsg &&
					dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "minute") >= 5;
					const separateLogic = i === 0 || prevMsg && dayjs(msg.createdAt).diff(dayjs(prevMsg.createdAt), "day") >= 1;

				return (
					<React.Fragment key={msg.id}>
						{separateLogic && <MessageSeparator date={msg.createdAt} />}

						<MessageCard
								msg={msg}
								isFirstGroup={isFirstGroup}
								onDelete={(id: string) => deleteMessage(id)}
							></MessageCard>
							

					</React.Fragment>
				);
			})}

			<RefAnchor></RefAnchor>
		</>
	);
};

const RefAnchor = () => {
	const { messages, containerRef } = useChatProvider();
	const scrollRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
		// "100px tolerance" for near-bottom

		if (isAtBottom) {
			scrollRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	useLayoutEffect(() => {
		if (scrollRef.current) {
			scrollRef.current?.scrollIntoView({ behavior: "instant" });
		}
	}, [])

	return (
			<span ref={scrollRef}></span>
	);
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
