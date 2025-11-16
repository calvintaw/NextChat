"use client";
import { AttachmentDropdown } from "./AttachmentDropdown";
import TextareaAutosize from "react-textarea-autosize";
import { ChatToolbar } from "./ChatToolBar";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { clsx } from "clsx";
import React from "react";
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
import { supabase } from "@/app/lib/supabase";
import { includeLinks } from "@/app/lib/utilities";

type ChatInputBoxProps = {
	activePersons: string[];
	roomId: string;
	user: User;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
	isBlocked: boolean;
};

export type ChatInputBoxRef = {
	sendMessage: (input: string, type?: MessageContentType) => void;
};

const ChatInputBox = forwardRef<ChatInputBoxRef, ChatInputBoxProps>((props, ref) => {
	const { activePersons, roomId, user, setMessages, isBlocked } = props;

	const { input, setInput, replyToMsg, setReplyToMsg, textRef, isSystem, setActivePersons } = useChatProvider();
	const [isFocused, setIsFocused] = useState(false);
	const [style, setStyle] = useState("!max-h-10");
	const [isPending, setIsPending] = useState(false);
	const { canSendMessage } = useMessageLimiter(25, 60_000);
	const toast = useToast();

	// --- Supabase Broadcast Typing Logic ---
	const channel = React.useMemo(() => supabase.channel(`room:${roomId}`), [roomId]);

	const sendTypingStart = () => {
		channel.send({
			type: "broadcast",
			event: "typing", // MUST match listener in ChatBox.tsx
			payload: { status: "started", displayName: user.displayName },
		});
	};

	const sendTypingStop = () => {
		channel.send({
			type: "broadcast",
			event: "typing", // MUST match listener in ChatBox.tsx
			payload: { status: "stopped", displayName: user.displayName },
		});
	};

	const { trigger: triggerTypingAnimation, cancel: cancelTypingAnimation } = useDebounce({
		startCallback: sendTypingStart,
		endCallback: sendTypingStop,
		delay: 2000,
	});

	useEffect(() => {
		setStyle("!min-h-10");
	}, []);

	// textbox typing animation code
	useEffect(() => {
		if (!textRef.current) return;

		const handleInput = () => triggerTypingAnimation();

		const textarea = textRef.current;
		textarea.addEventListener("input", handleInput);

		return () => {
			textarea.removeEventListener("input", handleInput);
		};
	}, [triggerTypingAnimation]); // Added triggerTypingAnimation to dependencies

	const sendMessage = async (input: string, type: MessageContentType = "text") => {
		const tempId = uuidv4();
		if (isSystem) setIsPending(true);
		if (roomId.startsWith("system-room")) setActivePersons((prev: string[]) => [...prev, "system"]);

		const hasLinks = type === "text" ? includeLinks(input) : false;

		const temp_msg = {
			id: tempId,
			room_id: roomId,
			sender_id: user.id,
			sender_image: user.image ?? null,
			sender_display_name: user.displayName,
			content: input,
			replyTo: replyToMsg ? replyToMsg.id : null,
			createdAt: new Date().toISOString(),
			edited: false,
			reactions: {},
			type: hasLinks ? "link" : type,
		};

		console.log("does my msg has Links: ", hasLinks)

		cancelTypingAnimation(750); // stop the typing animation 1.5s after use has stopped typing

		// Optimistic UI update
		setMessages((prev) => {
			return [
				...prev,
				{
					...temp_msg,
					synced: "pending",
				},
			];
		});

		// Database insertion triggers the Supabase Realtime listener in ChatBox.tsx
		if (isSystem) {
			const result = await insertMessageInDB(temp_msg);
			if (!result.success && result.message) {
				toast({ title: result.message, subtitle: "", mode: "negative" });
				setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, synced: false } : msg)));
			} else if (result.success) {
				setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, synced: true } : msg)));
			}
		} else {
			insertMessageInDB(temp_msg).then((result) => {
				if (result.success) {
					setMessages((prev) => prev.map((msg) => (msg.id === temp_msg.id ? { ...msg, synced: true } : msg)));
				} else {
					setMessages((prev) => prev.map((msg) => (msg.id === temp_msg.id ? { ...msg, synced: false } : msg)));
				}
			});
		}

		if (isSystem) setIsPending(false);
		setActivePersons((prev: string[]) => prev.filter((name) => name != "system"));
	};

	useImperativeHandle(ref, () => ({
		sendMessage,
	}));

	const handleFileUpload = (url: string[], type: "image" | "video") => {
		if (isBlocked || (isBlocked && isSystem) || isSystem) return;
		sendMessage(JSON.stringify(url), type);
		// turn url to json as there can be multiple images or videos uploaded at the same time so URL is ARRAY type
	};

	// function that calls sendMessage and is triggered when user click ENTER
	const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey && textRef.current) {
			e.preventDefault(); // prevents new line from being written
			if (isBlocked || (isSystem && isBlocked) || isPending) return;
			if (textRef.current.value.trim() === "") return;
			if (!canSendMessage()) return;

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
		<div className={clsx("relative", (isBlocked || (isSystem && isBlocked)) && "cursor-not-allowed")}>
			<div
				className={clsx("p-4 pt-0", (isBlocked || (isSystem && isBlocked)) && "pointer-events-none")}
				data-tooltip-id={"typing-indicator"}
			>
				<TypingIndicator displayName={activePersons} />
				<ReplyToBox></ReplyToBox>

				<div
					id="ChatInputBox"
					className={clsx(
						"flex items-end gap-2 rounded-lg px-3 py-1.5 bg-background dark:bg-accent/50 border border-foreground/15 not-dark:!border-foreground/30 focus-within:border-muted/25 relative shadow-lg",
						replyToMsg && "rounded-t-none !border-muted/25"
					)}
				>
					<AttachmentDropdown
						isDisabled={isBlocked || isSystem || (isSystem && isBlocked) || isPending}
						roomId={roomId}
						handleFileUpload={handleFileUpload}
					/>
					{!isFocused && (
						<div
							className="max-[500px]:hidden absolute border top-1/2 -translate-y-1/2 right-22
			             text-sm bg-black/25  not-dark:text-black text-white rounded-md p-1.5 py-1 border-background
			             z-[1]
			             opacity-50
			             pointer-events-none
			             "
						>
							Press Ctrl + / to type
						</div>
					)}
					<TextareaAutosize
						autoComplete="off"
						disabled={isBlocked || (isSystem && isBlocked)}
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
						textRef={textRef}
						sendMessage={sendMessage}
						setReplyToMsg={setReplyToMsg}
						replyToMsg={replyToMsg}
						setInput={setInput}
						isPending={isPending}
						isFocused={isFocused}
						isSystem={isSystem}
						isBlocked={isBlocked}
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
});

const ReplyToBox = () => {
	const { replyToMsg, setReplyToMsg } = useChatProvider();

	if (!replyToMsg) return null;
	console.log(replyToMsg);

	return (
		<a
			href={`#${replyToMsg.id}`}
			id="replyToBox"
			className="border p-4 py-2 text-sm no-underline decoration-0
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
	// if (!displayName || displayName.length === 0) return null;

	return (
		<div
			className="
			        
			        flex
			        w-full
			 				h-[22px]
			        max-w-lg
			        overflow-hidden
			 mb-0.5
			        
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
			{displayName &&
				displayName.map((name, index) => (
					<div
						key={index}
						className="inline-flex flex-shrink-0 items-center gap-1 px-2 py-0.5 rounded-full text-xs text-text shadow-sm border-accent border mr-1"
					>
						<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
						<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
						<span className="typing-dot w-1.5 h-1.5 rounded-full bg-text" />
						<span className="font-semibold tracking-wide">
							{name !== "system" && name} {name !== "system" ? "is typing" : "Crafting a response"}
						</span>
					</div>
				))}
		</div>
	);
};

export default ChatInputBox;
