import React from "react";
import TicTacToeHome from "./TicTacToe";
import type { User } from "@/app/lib/definitions";

type Props = {
	name: string;
	user: User;
};
const GameContainer = ({ name, user }: Props) => {
	if (name !== "tictactoe") return null;
	return (
		<>
			<TicTacToeHome user={user}></TicTacToeHome>
		</>
	);
};

export default GameContainer;
