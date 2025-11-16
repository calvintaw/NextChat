import { getChats } from "@/app/lib/actions";
import { ChatPanelHeader, ChatPreviewContainer } from "./ChatPreview";
import { User } from "@/app/lib/definitions";

const ChatPanel = async ({ user }: { user: User }) => {
	const chats = await getChats(user.id);
	return (
		<section
			id="chat-panel"
			className="
    min-w-[260px] flex-col flex-1 h-full max-h-[90vh]  pb-40 p-2 px-2.5 pr-0.5 overflow-y-auto gap-1.5
		border
		border-contrast
		border-r-0
		lg:rounded-tl-2xl
    absolute left-15.75
		max-sm:left-13
		min-sm:border-l-0
		lg:border-l

		bottom-0
		max-lg:border-border
		-translate-x-[calc(100%+64px)]
		[#sidebar.active_&]:translate-x-0
		[#sidebar.active_&]:!min-w-[280px]
		z-30 bg-background
    lg:static lg:translate-x-0 lg:flex lg:z-auto lg:bg-transparent

    sidebar-scrollbar

  "
		>
			<ChatPanelHeader user={user} />
			<ChatPreviewContainer user={user} chats={chats} />
		</section>
	);
};

export default ChatPanel;

