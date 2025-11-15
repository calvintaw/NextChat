"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { ChatType, ContactType } from "../definitions";

interface FriendsContextType {
	friends: ChatType[];
	contacts: ContactType[];
	setFriends: React.Dispatch<React.SetStateAction<ChatType[]>>;
	setContacts: React.Dispatch<React.SetStateAction<ContactType[]>>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
	children: ReactNode;
}

export const FriendsProvider: React.FC<FriendsProviderProps> = ({ children }) => {
	const [friends, setFriends] = useState<ChatType[]>([]);
	const [contacts, setContacts] = useState<ContactType[]>([]);

	const contextValue: FriendsContextType = {
		friends,
		setFriends,
		contacts,
		setContacts,
	};

	return <FriendsContext.Provider value={contextValue}>{children}</FriendsContext.Provider>;
};

export const useFriendsProvider = (): FriendsContextType => {
	const context = useContext(FriendsContext);
	if (!context) {
		throw new Error("useFriendsProvider must be used within a FriendsProvider");
	}
	return context;
};

export default FriendsProvider;
