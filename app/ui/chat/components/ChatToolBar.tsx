import React, { useState } from "react";
import { AddReactionBtn } from "./AddReactionBtn";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import clsx from "clsx";

export const ChatToolbar = ({ setEmoji }: {setEmoji: (emoji: EmojiClickData["emoji"]) => void}) => {
	const [open, setOpen] = useState(false);

		const reactions = [
		"1f621",     // 😡
		"1f44e",     // 👎
		"1f64f",     // 🙏
		"1f622",     // 😢
		"1f603",     // 😃
		"2764-fe0f", // ❤️
		"1f44d"      // 👍
	];


	return (
		<>
			<div className={clsx("flex items-center gap-2 min-h-10 bg-transparent chat-toolbar-icon", open && "active z-20")}>
				{open && <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setOpen(false)} />}

				<AddReactionBtn onClick={() => setOpen((prev) => !prev)}></AddReactionBtn>

				<div className="absolute -top-15 right-0 z-20">
					<EmojiPicker
						open={open}
						width="100%"
						height="100%"
						reactions={reactions}
						allowExpandReactions={false}
						searchDisabled
						className="!border-border !border-2 !bg-surface !transition-none !shadow-lg"
						skinTonesDisabled
						categories={[]}
						onReactionClick={(emojiData: EmojiClickData) => setEmoji(emojiData.emoji)}
					/>
				</div>
			</div>
		</>
	);
};
