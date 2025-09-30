import { AttachmentDropdown } from "./AttachmentDropdown";
import TextareaAutosize from "react-textarea-autosize";
import { ChatToolbar } from "./ChatToolBar";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import React from "react";
import { socket } from "@/app/lib/socket";
import { MessageContentType, MessageType, User } from "@/app/lib/definitions";
import useDebounce from "@/app/lib/hooks/useDebounce";
import { useChatProvider } from "../ChatBoxWrapper";
import { RxCross2 } from "react-icons/rx";
import { IconWithSVG } from "../../general/Buttons";
import { useMessageLimiter } from "@/app/lib/hooks/useMsgLimiter";
import { v4 as uuidv4 } from "uuid";
import useEventListener from "@/app/lib/hooks/useEventListener";
import { insertMessageInDB } from "@/app/lib/actions";
import { useToast } from "@/app/lib/hooks/useToast";

type ChatInputBoxProps = {
	activePersons: string[];
	roomId: string;
	user: User;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
	tempIdsRef: React.MutableRefObject<Set<string>>;
	isBlocked: boolean;
	initialLoading: boolean;
};

const ChatInputBox = ({
	activePersons,
	roomId,
	user,
	setMessages,
	initialLoading,
	tempIdsRef,
	isBlocked,
}: ChatInputBoxProps) => {
	const { input, setInput, replyToMsg, setReplyToMsg, textRef, isSystem } = useChatProvider();
	const [isFocused, setIsFocused] = useState(false);
	const [style, setStyle] = useState("!max-h-10");
	const { canSendMessage } = useMessageLimiter(25, 60_000);
	const { trigger, cancel } = useDebounce({
		startCallback: () => socket.emit("typing started", roomId, user.displayName),
		endCallback: () => socket.emit("typing stopped", roomId),
		delay: 2000,
	});
	const toast = useToast();

	useEffect(() => {
		setStyle("!min-h-10");
	}, []);

	useEffect(() => {
		if (!textRef.current) return;

		const handleInput = () => trigger();

		const textarea = textRef.current;
		textarea.addEventListener("input", handleInput);

		return () => {
			textarea.removeEventListener("input", handleInput);
		};
	}, [trigger]);

	const sendMessage = async (input: string, type: MessageContentType = "text") => {
		if (isBlocked || isSystem) return;
		const tempId = uuidv4();
		tempIdsRef.current.add(tempId);

		const temp_msg = {
			tempId: tempId,
			room_id: roomId,
			sender_id: user.id,
			sender_image: user.image ?? null,
			sender_display_name: user.displayName,
			content: input,
			type,
			replyTo: replyToMsg ? replyToMsg.id : null,
			edited: false,
			reactions: {},
		};

		cancel(750); // stop the typing animation

		setMessages((prev) => {
			return [
				...prev,
				{
					...temp_msg,
					content: `${temp_msg.content}`,
					type,
					id: tempId,
					createdAt: new Date().toISOString(),
					synced: "pending",
				},
			];
		});

		// frequent changing of react state is hurting performance I think
		// TODO: maybe find a way to boost performance
		const result = await insertMessageInDB(temp_msg);
		if (!result.success && result.message) {
			toast({ title: result.message, subtitle: "", mode: "negative" });
			setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? { ...msg, synced: false } : msg)));
		} else if (result.success) {
			setMessages((prev) => prev.map((msg) => (msg.tempId === tempId ? { ...msg, synced: true } : msg)));
		}
	};

	const handleFileUpload = (url: string[], type: "image" | "video") => {
		sendMessage(JSON.stringify(url), type); // turn url to json as there can be multiple images or videos uploaded at the same time so URL is ARRAY type
	};

	// function that calls sendMessage and is triggered when user click ENTER
	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && textRef.current) {
			e.preventDefault(); // prevents new line from being written
			if (textRef.current.value.trim() === "") return;
			if (!canSendMessage()) return;

			socket.emit("join", user.id); // joining the same user id room as the socket server on renderer.com shutdown within 15min of inactivity so the msg would never reach anywhere.
			sendMessage(textRef.current?.value);
			textRef.current.value = "";

			// set input to "", input is not synced with textRef.current.value so need to manually check
			if (input.trim() === "") setInput("");
			if (replyToMsg) setReplyToMsg(null);
		}
	};

	// use effect side effect for focusing input when ctrl + /
	useEventListener("keydown", (event: KeyboardEvent) => {
		if (event.ctrlKey && event.key === "/" && textRef.current) {
			console.log("Ctrl + / was pressed!");
			textRef.current.focus();
		}
	});

	// when user click reply, auto focuses the input
	useEffect(() => {
		if (replyToMsg) textRef.current?.focus();
	}, [replyToMsg]);

	return (
		<div className={clsx((isBlocked || isSystem) && "cursor-not-allowed", initialLoading && "pointer-events-none")}>
			<div
				className={clsx("p-4 relative mb-3 ", (isBlocked || isSystem) && "opacity-75 pointer-events-none")}
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
					<AttachmentDropdown roomId={roomId} handleFileUpload={handleFileUpload} />
					{!isFocused && (
						<div
							className="max-[500px]:hidden absolute border top-1/2 -translate-y-1/2 right-15
							text-sm bg-black/25  not-dark:text-black text-white rounded-md p-1.5 py-1 border-background
							z-[1]
							opacity-50
							"
						>
							Press Ctrl + / to type
						</div>
					)}

					<TextareaAutosize
						disabled={isBlocked || isSystem}
						ref={textRef}
						name="query"
						id="chatbox-TextareaAutosize"
						minRows={1}
						maxRows={8}
						placeholder="Write a message"
						onKeyDown={handleKeyPress}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						className={clsx(
							"w-full resize-none bg-transparent text-text placeholder-muted border-none outline-none focus:outline-none focus:ring-0 relative",
							style
						)}
					/>

					<ChatToolbar
						setEmoji={(emoji: string) => {
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
	const { replyToMsg, setReplyToMsg } = useChatProvider();

	if (!replyToMsg) return null;
	console.log(replyToMsg);

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
};

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
