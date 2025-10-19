import React, { JSX } from "react";
import TicTacToeHome from "./TicTacToe";
import SnakeHome from "./Snake";
import type { User } from "@/app/lib/definitions";

type Props = {
	name: string;
	user: User;
};

const GameContainer = ({ name, user }: Props) => {
	const gamesMap: Record<string, JSX.Element> = {
		tictactoe: <TicTacToeHome user={user} />,
		snake: <SnakeHome user={user} />,
	};

	// Return the matched game or null if not found
	return gamesMap[name] ?? null;
};

export default GameContainer;
