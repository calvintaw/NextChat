import { getChats } from "@/app/lib/actions";
import { ChatPanelHeader, ChatPreviewContainer } from "./ChatPreview";
import { User } from "@/app/lib/definitions";

const ChatPanel = async ({user}:{user:User}) => {
	const chats = await getChats(user.id);	
	return (
		<section
			id="chat-panel"
			className="
    min-w-[280px] flex-col flex-1 h-full max-h-[90vh]  pb-40 p-2 px-2.5 pr-0.5 overflow-y-scroll gap-1.5 
		border-contrast
		border
		border-r-0
		lg:rounded-tl-2xl
    absolute left-[64px] 
		bottom-0
		max-lg:border-border
		-translate-x-[calc(100%+64px)] z-30 bg-background 
    lg:static lg:translate-x-0 lg:flex lg:z-auto lg:bg-transparent 
    
		fade-bg-bottom-early
    sidebar-scrollbar

  "
		>
			<ChatPanelHeader />
			<ChatPreviewContainer user={user} chats={chats} />
		</section>
	);
};

export default ChatPanel;
