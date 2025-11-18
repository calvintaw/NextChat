import { removeReactionFromMSG, getUsername } from "@/app/lib/actions";
import { MessageType } from "@/app/lib/definitions";
import { useToast } from "@/app/lib/hooks/useToast";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useChatProvider } from "../../ChatBoxWrapper";

export const ReactionsRow = ({ msg, isFirstGroup }: { msg: MessageType; isFirstGroup: boolean }) => {
	const { messages, setMessages, user, roomId } = useChatProvider();
	const [usernamesMap, setUsernamesMap] = useState<Record<string, string>>({});
	const toast = useToast();

	const handleRemoveReaction = async (msg_id: string, emoji: string) => {
		const originalMsg = [...messages];
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((tx) => tx.id === msg_id);
			if (index === -1) return prev;
			const newMsg = [...prev];
			newMsg[index] = {
				...newMsg[index],
				reactions: {
					...newMsg[index].reactions,
					[emoji]: (newMsg[index].reactions[emoji] || []).filter((id) => id !== user.id),
				},
			};
			return newMsg;
		});
		const result = await removeReactionFromMSG({ id: msg_id, roomId, userId: user.id, emoji });
		if (!result.success) {
			setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.error as string });
		}
	};

	const fetchUsernameIfNeeded = async (userId: string) => {
		if (usernamesMap[userId]) return usernamesMap[userId];
		const result = await getUsername(userId);
		const username = result.success ? result.username : "";
		setUsernamesMap((prev) => ({ ...prev, [userId]: username as string }));
		return username;
	};

	useEffect(() => {
		if (!msg.reactions) return;

		const fetchAll = async () => {
			for (const users of Object.values(msg.reactions)) {
				for (const userId of users) {
					await fetchUsernameIfNeeded(userId);
				}
			}
		};

		fetchAll();
	}, [msg.reactions]);

	if (!msg.reactions) return null;

	return (
		<div
			key={`${msg.id}-reactions`}
			className={clsx(
				"mt-2 h-fit w-fit flex gap-1 flex-wrap max-sm:pl-3 max-sm:mb-0.5",
				!isFirstGroup && !msg.replyTo && "sm:ml-15"
			)}
		>
			{Object.entries(msg.reactions).map(([emoji, users], idx) => {
				if (users.length === 0) return null;
				return (
					<button
						data-tooltip-id="chatbox-reactions-row-tooltip"
						data-tooltip-content={`Reacted by ${users.map((id) => usernamesMap[id] || "loading...").join(", ")}`}
						key={idx}
						onClick={() => handleRemoveReaction(msg.id, emoji)}
						className="
              flex items-center gap-1 px-1.5 py-[1px]
              rounded-md
              border border-primary
              bg-primary/25
              text-sm
              hover:bg-primary/50
              transition-colors
              select-none
              cursor-pointer
            "
					>
						<span className="text-base">{emoji}</span>
						<span>{users.length}</span>
					</button>
				);
			})}
		</div>
	);
};
