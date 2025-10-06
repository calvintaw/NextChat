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
import { getSystemUser, insertMessageInDB } from "@/app/lib/actions";
import { useToast } from "@/app/lib/hooks/useToast";
import { examplePassages, sendWithRetry, sleep } from "@/app/lib/utilities";
import { FaArrowUp } from "react-icons/fa";
import { IoArrowUp } from "react-icons/io5";
import { GrStatusDisabledSmall } from "react-icons/gr";
import { GoSquareFill } from "react-icons/go";

type ChatInputBoxProps = {
	activePersons: string[];
	roomId: string;
	user: User;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
	isBlocked: boolean;
	initialLoading: boolean;
};

const ChatInputBox = ({ activePersons, roomId, user, setMessages, initialLoading, isBlocked }: ChatInputBoxProps) => {
	const { input, setInput, replyToMsg, setReplyToMsg, textRef, isSystem, setActivePersons, ChatBotTopic } =
		useChatProvider();
	const [isFocused, setIsFocused] = useState(false);
	const [style, setStyle] = useState("!max-h-10");
	const [isPending, setIsPending] = useState(false);
	const { canSendMessage } = useMessageLimiter(25, 60_000);
	const { trigger: triggerTypingAnimation, cancel: cancelTypingAnimation } = useDebounce({
		startCallback: () => socket.emit("typing started", roomId, user.displayName),
		endCallback: () => socket.emit("typing stopped", roomId, user.displayName),
		delay: 2000,
	});
	const toast = useToast();

	useEffect(() => {
		setStyle("!min-h-10");
	}, []);

	useEffect(() => {
		if (!textRef.current) return;

		const handleInput = () => triggerTypingAnimation();

		const textarea = textRef.current;
		textarea.addEventListener("input", handleInput);

		return () => {
			textarea.removeEventListener("input", handleInput);
		};
	}, []);

	const sendMessage = async (input: string, type: MessageContentType = "text") => {
		const tempId = uuidv4();
		setIsPending(true);
		if (roomId.startsWith("system-room")) setActivePersons((prev: string[]) => [...prev, "system"]);

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
			type,
		};

		cancelTypingAnimation(750); // stop the typing animation 1.5s after use has stopped typing

		setMessages((prev) => {
			return [
				...prev,
				{
					...temp_msg,
					synced: "pending",
				},
			];
		});

		// frequent changing of react state is hurting performance I think
		// TODO: maybe find a way to boost performance

		const result = await insertMessageInDB(temp_msg);
		if (!result.success && result.message) {
			toast({ title: result.message, subtitle: "", mode: "negative" });
			setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, synced: false } : msg)));
		} else if (result.success) {
			if (roomId.startsWith("system-room")) {
				// TODO: FIX BOT

				const botReply = await getReplyFromBot(temp_msg.content, ChatBotTopic);

				if (botReply.success && botReply.message && botReply.bot) {
					const botMsg: MessageType & { room_id: string } = {
						id: uuidv4(),
						room_id: roomId,
						sender_id: botReply.bot.id,
						sender_image: botReply.bot.image,
						sender_display_name: botReply.bot.displayName,
						content: botReply.message,
						replyTo: temp_msg.id,
						createdAt: new Date().toISOString(),
						edited: false,
						reactions: {},
						type: "text",
					};

					console.log("bot msg id: ", botMsg.id, "user msg id: ", temp_msg.id);

					const botInsert = await insertMessageInDB(botMsg);
					if (botInsert.success) {
						setMessages((prev) => [...prev, { ...botMsg, synced: true }]);
					}
				}

				// sendWithRetry("system", temp_msg, 3, 2000)
				// 	.then((res) => console.log("System message delivered:", res))
				// 	.catch((err) => console.error("System message failed:", err));
			} else {
				sendWithRetry("message", temp_msg, 3, 2000)
					.then((res) => console.log("Message delivered:", res))
					.catch((err) => console.error("Message failed:", err));
			}
			setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, synced: true } : msg)));
		}
		setIsPending(false);
		setActivePersons((prev: string[]) => prev.filter((name) => name != "system"));
	};

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

			socket.emit("join", roomId); // joining the same user id room as the socket server on renderer.com shutdown within 15min of inactivity so the msg would never reach anywhere.
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
		<div
			className={clsx(
				(isBlocked || (isSystem && isBlocked)) && "cursor-not-allowed"
				// initialLoading && "pointer-events-none"
			)}
		>
			<div
				className={clsx("p-4 relative mb-3 ", (isBlocked || (isSystem && isBlocked)) && "pointer-events-none")}
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
					<AttachmentDropdown
						isDisabled={isBlocked || (isSystem && isBlocked) || isPending}
						roomId={roomId}
						handleFileUpload={handleFileUpload}
					/>
					{!isFocused && (
						<div
							className="max-[500px]:hidden absolute border top-1/2 -translate-y-1/2 right-22
							text-sm bg-black/25  not-dark:text-black text-white rounded-md p-1.5 py-1 border-background
							z-[1]
							opacity-50
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
					<IconWithSVG
						title="Send message"
						className={clsx(
							"icon-chatbox group my-auto animate-none border bg-foreground !rounded-full",
							!isPending && ((!isFocused && !isPending) || (isSystem && isBlocked) || isBlocked)
								? "opacity-50"
								: "opacity-100",
							isPending && "dark:!bg-background/75 !opacity-100 !bg-black/25 border-0"
						)}
					>
						{!isPending && <IoArrowUp className="text-xs text-background"></IoArrowUp>}{" "}
						{isPending && <GoSquareFill className="text-xs text-foreground"></GoSquareFill>}
					</IconWithSVG>
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
        flex
        w-full
        max-w-lg
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
					<span className="font-semibold tracking-wide">
						{name !== "system" && name} {name !== "system" ? "is typing" : "Crafting a response"}
					</span>
				</div>
			))}
		</span>
	);
};

export default ChatInputBox;

// get reply from bot fn

// async function getReplyFromBot(msg: {
// 	content: string;
// 	room_id: string;
// }): Promise<{ success: boolean; message?: string; bot?: User | null }> {
// 	try {
// 		const res = await fetch("/api/bot", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify({
// 				question: msg.content,
// 				passage: `
// 					Space exploration has always fascinated humanity, but one of the most mysterious and intriguing objects in the universe is the black hole. A black hole is a region in space where the gravitational pull is so strong that nothing—not even light—can escape from it. Black holes are formed when massive stars collapse under their own gravity at the end of their life cycle. Despite being invisible, black holes reveal their presence by the effect they have on nearby stars and gas. The first-ever image of a black hole’s event horizon, captured in 2019 by the Event Horizon Telescope, confirmed many theoretical predictions about these cosmic phenomena. Black holes also challenge our understanding of physics, particularly the laws of relativity and quantum mechanics, making them a subject of intense scientific research.
// 				`, // adapt as needed

// 				// example questions

// 				// What is a black hole?

// 				// How are black holes formed?

// 				// When was the first image of a black hole captured?

// 				// Why are black holes important in physics?
// 			}),
// 		});

// 		if (!res.ok) {
// 			throw new Error(`Bot server error: ${res.status}`);
// 		}

// 		const data = await res.json();

// 		return {
// 			success: true,
// 			message: data.reply, // best answer only
// 			bot: data.bot,
// 		};
// 	} catch (error) {
// 		console.error("getReplyFromBot ERROR:", error);
// 		return {
// 			success: false,
// 			message: "Bot is unavailable. Please try again later.",
// 			bot: null,
// 		};
// 	}
// }

// tensor flow chatbot codes

import * as qna from "@tensorflow-models/qna";
let model: qna.QuestionAndAnswer | null = null;

export async function preloadQnAModel() {
	if (!model) {
		console.log("Loading MobileBERT QnA model in background...");
		model = await qna.load();
		console.log("Model loaded ✅");
	}
}

export async function getReplyFromBot(
	question: string,
	topic: keyof typeof examplePassages = "space"
): Promise<{ success: boolean; message?: string; bot?: User | null }> {
	try {
		// Lazy-load the MobileBERT model in browser
		if (!model) {
			await preloadQnAModel();
		}
		if (!model) throw new Error("QnA model failed to load");
		console.log("Model instance:", model);

		const passage = examplePassages[topic];
		const answers = await model.findAnswers(question, passage);
		const bot = await getSystemUser();

		console.log("Question:", question);
		console.log("Passage:", passage);
		console.log("Answers returned:", answers);

		// Pick the best answer (highest score)
		const bestAnswer = answers.length ? answers.reduce((prev, curr) => (curr.score > prev.score ? curr : prev)) : null;

		return {
			success: true,
			message: bestAnswer?.text ?? "No answer found.",
			bot,
		};
	} catch (err) {
		console.error("QnA ERROR:", err);
		return {
			success: true,
			message: "Bot is unavailable. Please try again later.",
			bot: null,
		};
	}
}
