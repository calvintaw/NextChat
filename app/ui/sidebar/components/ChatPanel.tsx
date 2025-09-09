import { getChats } from "@/app/lib/actions";
import { ChatPanelHeader, ChatPreviewContainer } from "./ChatPreview";
import { User } from "@/app/lib/definitions";

const ChatPanel = async ({user}:{user:User}) => {
	const chats = await getChats(user.id);	
	return (
		<section
			id="chat-panel"
			className="
    min-w-[280px] flex-col flex-1 h-full max-h-[90vh] p-2 px-2.5 pr-0.5 overflow-y-auto gap-1.5 
		border-contrast
    absolute left-[64px] 
		bottom-0
		max-lg:border-r-2
		max-lg:border-border
		-translate-x-[calc(100%+64px)] z-30 bg-background 
		[#sidebar.active_&]:!border-2
		[#sidebar.active_&]:!border-red-500

    lg:static lg:translate-x-0 lg:flex lg:z-auto lg:bg-transparent 
    
    sidebar-scrollbar
  "
		>
			<ChatPanelHeader />
			<ChatPreviewContainer user={user} chats={chats} />
		</section>
	);
};

export default ChatPanel;
