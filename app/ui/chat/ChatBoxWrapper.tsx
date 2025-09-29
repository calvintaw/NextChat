import { MessageType } from "@/app/lib/definitions";
import React, { createContext, useState, useContext, ReactNode, useRef } from "react";

interface ChatContextType {
	input: string;
	setInput: React.Dispatch<React.SetStateAction<string>>;
	msgToEdit: string | null;
	setMsgToEdit: React.Dispatch<React.SetStateAction<string | null>>;
	replyToMsg: MessageType | null;
	setReplyToMsg: React.Dispatch<React.SetStateAction<MessageType | null>>;
	textRef: React.RefObject<HTMLTextAreaElement | null>;
	[key: string]: any;
}


interface ChatProviderProps {

	children: ReactNode;
	config?: Partial<ChatContextType>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const ChatProvider = ({ children, config = {} }: ChatProviderProps) => {
	const [input, setInput] = useState("");
	const [replyToMsg, setReplyToMsg] = useState<MessageType | null>(null);
	const [msgToEdit, setMsgToEdit] = useState<string | null>(null);
		const textRef = useRef<HTMLTextAreaElement |null>(null)
	

  const contextValue = {
		input,
		setInput,
		msgToEdit,
		setMsgToEdit,
		replyToMsg,
		setReplyToMsg,
		textRef,
		...config,
	};

	return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export const useChatProvider = () => {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChat must be used within a ChatProvider");
	}
	return context;
};

export default ChatProvider;
