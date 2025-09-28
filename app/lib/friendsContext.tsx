"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { ChatType } from "./definitions";

interface FriendsContextType {
	friends: ChatType[];
	setFriends: React.Dispatch<React.SetStateAction<ChatType[]>>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

interface FriendsProviderProps {
	children: ReactNode;
}

export const FriendsProvider: React.FC<FriendsProviderProps> = ({ children }) => {
	const [friends, setFriends] = useState<ChatType[]>([]);

	const contextValue: FriendsContextType = {
		friends,
		setFriends,
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
