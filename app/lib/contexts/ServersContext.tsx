"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Room } from "../definitions";

interface ServersContextType {
	joinedServers: Room[];
	setJoinedServers: React.Dispatch<React.SetStateAction<Room[]>>;
}

const ServersContext = createContext<ServersContextType | undefined>(undefined);

interface ServersProviderProps {
	children: ReactNode;
}

export const ServersProvider: React.FC<ServersProviderProps> = ({ children }) => {
	const [joinedServers, setJoinedServers] = useState<Room[]>([]);

	const contextValue: ServersContextType = {
		joinedServers,
		setJoinedServers,
	};

	return <ServersContext.Provider value={contextValue}>{children}</ServersContext.Provider>;
};

export const useServersProvider = (): ServersContextType => {
	const context = useContext(ServersContext);
	if (!context) {
		throw new Error("useServersProvider must be used within a ServersProvider");
	}
	return context;
};

export default ServersProvider;
