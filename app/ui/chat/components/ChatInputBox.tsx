import { AttachmentDropdown } from "./AttachmentDropdown";
import TextareaAutosize from "react-textarea-autosize";
import { ChatToolbar } from "./ChatToolBar";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import React from "react";
import { socket } from "@/app/lib/socket";
import { MessageType, User } from "@/app/lib/definitions";
import useDebounce from "@/app/lib/hooks/useDebounce";
import { EmojiClickData } from "emoji-picker-react";
import { useChatProvider } from "../ChatBoxWrapper";
import { RxCross2, RxCrossCircled } from "react-icons/rx";
import { IconWithSVG } from "../../general/Buttons";

type EmojiIcon = EmojiClickData["emoji"];

type ChatInputBoxProps = {
	activePersons: string[];
	handleFileUpload: (url: string[], type: "image" | "video") => void;
	roomId: string;
	user: User;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
	tempIdsRef: React.MutableRefObject<Set<string>>;
};

const ChatInputBox = ({ activePersons, roomId, user, handleFileUpload, setMessages, tempIdsRef, isBlocked }: ChatInputBoxProps) => {
	const {input, setInput, replyToMsg, setReplyToMsg, textRef} = useChatProvider()
	const [style, setStyle] = useState("!max-h-10");

	useEffect(() => {
		setStyle("min-h-10");
	}, []);

	const { cancel } = useDebounce({
		state: input,
		startCallback: () => {
			if (input.trim() !== "") {
				socket.emit("typing started", roomId, user.displayName);
			}
		},
		endCallback: () => socket.emit("typing stopped", roomId),
		delay: 2000,
	});

	const sendMessage = (input: string) => {
		if (!input.trim()) return;
				const temp_msg = {
			room_id: roomId,
			sender_id: user.id,
			sender_image: user.image ?? null,
			sender_display_name: user.displayName,
			content: input,
			type: "text",
			replyTo: replyToMsg ? replyToMsg.id : null
		};

		cancel(750)
		if (roomId.startsWith("system-room")) {
			socket.emit("system", temp_msg);
		} else {
			socket.emit("message", temp_msg);
		}

		// instantly displaying for visuals
		const time = new Date().toISOString();
		tempIdsRef.current.add(time);

		setMessages((prev) => {
			return [
				...prev,
				{
					...temp_msg,
					content: `${temp_msg.content}`,
					type: "text",
					id: "",
					createdAt: time,
					edited: false,
					reactions: {},
					local: true,
				},
			];
		});
	};
	
	
	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && textRef.current) {
			e.preventDefault(); // prevents new line from being written
			sendMessage(textRef.current?.value);
			textRef.current.value = "";	
			setInput("");
			setReplyToMsg(null);
		}
	};


	useEffect(() => {
		if (replyToMsg) textRef.current?.focus()
	}, [replyToMsg])

	return (
		<div className={clsx(isBlocked && "cursor-not-allowed")}>
			<div
				className={clsx("p-4 relative mb-3 ", isBlocked && "opacity-75 pointer-events-none")}
				data-tooltip-id={"typing-indicator"}
			>
				<TypingIndicator displayName={activePersons} />
				<ReplyToBox></ReplyToBox>

				<div
					id="ChatInputBox"
					className={clsx(
						"flex items-start gap-2 rounded-lg px-3 py-1.5 bg-background dark:bg-accent/50 border border-foreground/15 not-dark:!border-foreground/30  focus-within:border-muted/25 relative shadow-lg",
						replyToMsg && "rounded-t-none !border-muted/25"
					)}
				>
					<AttachmentDropdown handleFileUpload={handleFileUpload} />
					<TextareaAutosize
						ref={textRef}
						name="query"
						id="chatbox-TextareaAutosize"
						maxRows={8}
						placeholder="Write a message"
						onKeyDown={handleKeyPress}
						className={clsx(
							"w-full resize-none bg-transparent text-text placeholder-muted border-none outline-none focus:outline-none focus:ring-0",
							style
						)}
					/>

					<ChatToolbar
						setEmoji={(emoji: EmojiIcon) => {
							if (!textRef.current) return;

							const textarea = textRef.current;
							const start = textarea.selectionStart;
							const end = textarea.selectionEnd;

							const currentValue = textarea.value;
							const newValue = currentValue.slice(0, start) + emoji + currentValue.slice(end);
							textarea.value = newValue;
							setInput(newValue);
							const cursorPos = start + emoji.length;
							textarea.selectionStart = textarea.selectionEnd = cursorPos;
						}}
					/>
				</div>
			</div>
		</div>
	);
};

const ReplyToBox = () => {
	const { replyToMsg, setReplyToMsg } = useChatProvider()

	if (!replyToMsg) return null
	console.log(replyToMsg)

	return (
		<a
			href={`#${replyToMsg.id}`}
			id="replyToBox"
			className="border p-4 py-2 text-sm no-underline
		flex justify-between items-center gap-2 bg-background/75 dark:bg-accent border-muted/25 not-dark:border-foreground/30 relative rounded-t-lg border-b-0 
		"
		>
			<div>
				<span className="text-text/75">Replying to </span>
				<span className="font-semibold tracking-wide text-success">{replyToMsg.sender_display_name}</span>
			</div>

			<IconWithSVG
				onClick={() => setReplyToMsg(null)}
				className="!w-4 !h-4 !p-0 !rounded-full bg-white/75 hover:bg-white flex items-center justify-center text-center"
			>
				<RxCross2 className="text-xs font-semibold dark:text-black text-white" />
			</IconWithSVG>
		</a>
	);
}

const TypingIndicator = ({ displayName }: { displayName: string[] }) => {
	if (!displayName || displayName.length === 0) return null;

	return (
		<span
			className="
        absolute
        -bottom-2
        left-5
        w-fit
        max-w-sm
        flex
        overflow-hidden
      "
			style={{
				// Apply a fade-out mask from fully visible to transparent
				WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
				WebkitMaskRepeat: "no-repeat",
				WebkitMaskSize: "100% 100%",
				maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
				maskRepeat: "no-repeat",
				maskSize: "100% 100%",
			}}
		>
			{displayName.map((name, index) => (
				<div
					key={index}
					className="inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-xs text-text shadow-sm border-accent border mr-1"
				>
					<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
					<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
					<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
					<span className="font-semibold tracking-wide">{name} is typing</span>
				</div>
			))}
		</span>
	);
};


export default ChatInputBox;
