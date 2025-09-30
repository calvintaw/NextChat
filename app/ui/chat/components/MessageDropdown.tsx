"use client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
	FaThumbsUp,
	FaLaughSquint,
	FaReply,
	FaArrowRight,
	FaCopy,
	FaThumbtack,
	FaLink,
	FaVolumeUp,
} from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IconWithSVG } from "../../general/Buttons";
import { IoIosArrowBack } from "react-icons/io";
import { HiDotsHorizontal } from "react-icons/hi";
import { FaThumbsDown } from "react-icons/fa";
import clsx from "clsx";
import useToggle from "@/app/lib/hooks/useToggle";
import { useState } from "react";
import { AiFillHeart } from "react-icons/ai";
import { useChatProvider } from "../ChatBoxWrapper";
import { FiEdit } from "react-icons/fi";
import { addReactionToMSG, removeReactionFromMSG } from "@/app/lib/actions";
import { MessageType } from "@/app/lib/definitions";
import { HiReply } from "react-icons/hi";
import { emoji } from "zod/v4";
import { flushSync } from "react-dom";
import { useToast } from "@/app/lib/hooks/useToast";
import { ImBin } from "react-icons/im";
import { RiDeleteBinFill } from "react-icons/ri";

type Props = {
	msg: MessageType;
	onDelete: (id: string) => void;
};

export function MessageDropdownMenu({ msg, onDelete }: Props) {
	const [open, toggleOpen] = useToggle(false);
	const [copied, setCopied] = useState(false);
	const { setMsgToEdit, messages, setMessages, user, roomId, setReplyToMsg } = useChatProvider();
	const toast = useToast();

	const toggleReaction = async (emoji: string) => {
		const originalMsg = [...messages];
		let didChange = false; // track if reaction changed
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((tx) => tx.id === msg.id);
			if (index === -1) return prev;

			const newMsg = [...prev];

			const currentReactors = new Set(newMsg[index].reactions?.[emoji] || []);
			const hasReacted = currentReactors.has(user.id);
			if (hasReacted) {
				currentReactors.delete(user.id);
				didChange = false; // user removed reaction
			} else {
				currentReactors.add(user.id);
				didChange = true; // user added reaction
			}

			newMsg[index] = {
				...newMsg[index],
				reactions: {
					...newMsg[index].reactions,
					[emoji]: [...currentReactors],
				},
			};
			return newMsg;
		});
		const result = didChange
			? await addReactionToMSG({ id: msg.id, roomId, userId: user.id, emoji })
			: await removeReactionFromMSG({ id: msg.id, roomId, userId: user.id, emoji });
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		}
	};

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 5000);
		} catch (err) {
			console.error("Failed to copy!", err);
		}
	};

	return (
		<div onClick={(e) => e.stopPropagation()}>
			<DropdownMenu.Root modal={false} open={open} onOpenChange={toggleOpen}>
				<div
					className={clsx(
						`
							hidden
							group-hover:!flex
							absolute bg-background dark:bg-surface z-40 -top-6.5 max-sm:right-5 right-20 rounded-lg border border-border/30 gap-1 items-center p-[0.2rem]
							`,
						open ? "!flex" : ""
					)}
				>
					{/* Emoji Reactions */}
					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Thumbs Up"
						className="icon-message-tooltip text-lg text-yellow-400"
						onClick={() => toggleReaction("👍")}
					>
						👍
					</IconWithSVG>

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Heart"
						className="icon-message-tooltip text-lg text-red-500"
						onClick={() => toggleReaction("❤️")}
					>
						❤️
					</IconWithSVG>

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Laugh"
						className="icon-message-tooltip text-lg text-yellow-300"
						onClick={() => toggleReaction("😃")}
					>
						😃
					</IconWithSVG>

					{msg.sender_id === user.id && (
						<IconWithSVG
							data-tooltip-id="icon-message-dropdown-menu-id"
							data-tooltip-content="Edit"
							className="icon-message-tooltip text-lg"
							onClick={() => {
								setMsgToEdit(msg.id);
								handleCopy(msg.id);
							}}
						>
							<FiEdit />
						</IconWithSVG>
					)}

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Delete"
						className="icon-message-tooltip"
						onClick={() => onDelete(msg.id)}
					>
						<ImBin className="!text-[20px]" />
					</IconWithSVG>

					{msg.sender_id !== user.id && (
						<IconWithSVG
							data-tooltip-id="icon-message-dropdown-menu-id"
							data-tooltip-content="Reply"
							className="icon-message-tooltip text-lg"
							onClick={() => {
								setReplyToMsg(msg);
							}}
						>
							<HiReply />
						</IconWithSVG>
					)}

					{/* Dots / Menu Trigger */}
					<DropdownMenu.Trigger asChild>
						<IconWithSVG className="icon-message-tooltip data-[state=open]:bg-accent">
							<HiDotsHorizontal />
						</IconWithSVG>
					</DropdownMenu.Trigger>
				</div>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						loop
						side="left"
						sideOffset={8}
						align="start"
						collisionPadding={20}
						className="DropdownMenu__Content p-3 rounded-2xl"
					>
						{/* Emoji Reactions Row */}
						<DropdownMenu.Group className="flex items-center gap-1 mb-2">
							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("👍")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-400">👍</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("❤️")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-red-500">❤️</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("😃")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-300">😃</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("👎")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-300">👎</IconWithSVG>
							</DropdownMenu.Item>
						</DropdownMenu.Group>

						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<IoIosArrowBack />
							Add Reaction
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaReply /> Reply
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaArrowRight /> Forward
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item
							onSelect={(e) => e.preventDefault()}
							className={`${copied && "text-success"} DropdownMenuItem gap-3`}
							onClick={() => handleCopy(msg.content)}
						>
							<FaCopy /> {!copied && <>Copy Text {"(Works)"}</>}
							{copied && "Copied Text"}
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaThumbtack /> Pin Message
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaLink /> Copy Message Link
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaVolumeUp /> Speak Message
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item
							onClick={() => onDelete(msg.id)}
							className="DropdownMenuItem data-[highlighted]:bg:error/20 text-error gap-3"
						>
							<ImBin className="text-lg" /> Delete Message {"(Works)"}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	);
}
