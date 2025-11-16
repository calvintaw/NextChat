"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Room } from "../definitions";
import useToggle from "../hooks/useToggle";

interface GeneralContextType {
	joinedServers: Room[];
	isVideoPageOpen: boolean;
	toggleVideoPage: (value: boolean) => void;
	setJoinedServers: React.Dispatch<React.SetStateAction<Room[]>>;
}

const GeneralContext = createContext<GeneralContextType | undefined>(undefined);

interface GeneralProviderProps {
	children: ReactNode;
}

export const GeneralProvider: React.FC<GeneralProviderProps> = ({ children }) => {
	const [joinedServers, setJoinedServers] = useState<Room[]>([]);
	const [isVideoPageOpen, toggleVideoPage] = useToggle(false);

	const contextValue: GeneralContextType = {
		joinedServers,
		setJoinedServers,
		isVideoPageOpen,
		toggleVideoPage,
	};

	return <GeneralContext.Provider value={contextValue}>{children}</GeneralContext.Provider>;
};

export const useGeneralProvider = (): GeneralContextType => {
	const context = useContext(GeneralContext);
	if (!context) {
		throw new Error("useGeneralProvider must be used within a GeneralProvider");
	}
	return context;
};

export default GeneralProvider;
