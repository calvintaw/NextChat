import React, { useState } from "react";
import { AddReactionBtn } from "./AddReactionBtn";
import clsx from "clsx";

type ChatToolbarProps = {
	setEmoji: (emoji: string) => void;
	isPending: boolean;
	isFocused: boolean;
	isSystem: boolean;
	isBlocked: boolean;
};

export const ChatToolbar = ({ setEmoji, isPending, isFocused, isSystem, isBlocked }: ChatToolbarProps) => {
	const [open, setOpen] = useState(false);

	return (
		<div className={clsx("flex items-center gap-2 min-h-10 bg-transparent chat-toolbar-icon", open && "active z-20")}>
			<DropdownMenu.Root modal={false} open={open} onOpenChange={(open) => setOpen(open)}>
				<DropdownMenu.Trigger asChild>
					<AddReactionBtn className={clsx(open && "animate-none transition-none")}></AddReactionBtn>
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						loop
						sideOffset={20}
						side="top"
						collisionPadding={20}
						className="DropdownMenu__Content !rounded-full !py-2 !px-3 !border-border !border-2 !bg-surface !transition-none !shadow-lg"
					>
						<div className="flex gap-2">
							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("😡")}
							>
								😡
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("👎")}
							>
								👎
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("🙏")}
							>
								🙏
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("😢")}
							>
								😢
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("😃")}
							>
								😃
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("❤️")}
							>
								❤️
							</IconWithSVG>

							<IconWithSVG
								className="icon-small text-[26px] bg-transparent cursor-pointer transform transition-transform duration-150 ease-in-out hover:scale-125"
								onClick={() => setEmoji("👍")}
							>
								👍
							</IconWithSVG>
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

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
	);
};

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { IconWithSVG } from "../../general/Buttons";
import { GoSquareFill } from "react-icons/go";
import { IoArrowUp } from "react-icons/io5";
