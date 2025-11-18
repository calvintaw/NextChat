"use client";

import { useGeneralProvider } from "@/app/lib/contexts/GeneralContextProvider";
import { ChatPanelHeader, ChatPreviewContainer } from "./ChatPreview";
import { ChatType, User } from "@/app/lib/definitions";
import clsx from "clsx";

const ChatPanel = ({ user, chats }: { user: User; chats: ChatType[] }) => {
	const { isVideoPageOpen } = useGeneralProvider();

	return (
		<section
			id="chat-panel"
			className={clsx(
				`
        min-w-[260px] flex-col flex-1 h-full max-h-[90vh] pb-40 p-2 px-2.5 pr-0.5
        overflow-y-auto gap-1.5 border border-contrast border-r-0
        bottom-0 max-sm:left-13 min-sm:border-l-0 sidebar-scrollbar
        z-30 bg-background
        `,
				!isVideoPageOpen
					? `
            lg:rounded-tl-2xl
            lg:border-l
            absolute left-15.75 -translate-x-[calc(100%+64px)]
            max-lg:border-border
            [#sidebar.active_&]:translate-x-0
            [#sidebar.active_&]:!min-w-[280px]
            lg:static lg:translate-x-0 lg:flex lg:z-auto lg:bg-transparent
          `
					: `
            border border-contrast border-r-0
            absolute left-15.75 -translate-x-[calc(100%+64px)]
            border-border

            [#sidebar.active_&]:translate-x-0
            [#sidebar.active_&]:!min-w-[280px]
          `
			)}
		>
			<ChatPanelHeader user={user} />
			<ChatPreviewContainer user={user} chats={chats} />
		</section>
	);
};

export default ChatPanel;
