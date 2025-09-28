"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";
import { Tooltip } from "react-tooltip";

interface PathContextType {
	path: string;
	setPath: React.Dispatch<React.SetStateAction<string>>;
}

const PathContext = createContext<PathContextType | undefined>(undefined);

interface PathProviderProps {
	children: ReactNode;
}

export const PathProvider: React.FC<PathProviderProps> = ({ children }) => {
	const [path, setPath] = useState("");

	const contextValue: PathContextType = {
		path,
		setPath,
	};

	return (
		<PathContext.Provider value={contextValue}>
			{children}
			<Tooltip className="my-tooltip" id={"avatar-tooltip"} place="right" border={`var(--tooltip-border)`} />
		</PathContext.Provider>
	);
};

export const usePathProvider = (): PathContextType => {
	const context = useContext(PathContext);
	if (!context) {
		throw new Error("usePathProvider must be used within a PathProvider");
	}
	return context;
};

export default PathProvider;
