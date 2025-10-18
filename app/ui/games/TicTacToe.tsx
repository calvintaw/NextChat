"use client";
import { usePathProvider } from "@/app/lib/PathContext";
import type { User } from "@/app/lib/definitions";
import React, { useEffect, useState } from "react";
import { FaRobot, FaUserFriends } from "react-icons/fa";

const winningStates = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

const TicTacToeHome: React.FC<{ user: User }> = ({ user }) => {
	const { setPath } = usePathProvider();
	const [GameStarted, setGameStarted] = useState(false);
	const [playerTurn, setPlayerTurn] = useState<"X" | "O">("X");
	const [opponent, setOpponent] = useState<string | null>(null);
	const [winner, setWinner] = useState<"X" | "O" | "Draw" | null>(null);
	const [board, setBoard] = useState<string[][]>(() => Array.from({ length: 3 }, () => ["", "", ""]));

	useEffect(() => {
		setPath("TicTacToe");
	}, []);

	function place(rowIdx: number, colIdx: number) {
		if (board[rowIdx][colIdx] || winner) return;

		setBoard((prev) => {
			const newBoard = prev.map((row) => [...row]);
			newBoard[rowIdx][colIdx] = playerTurn;

			if (hasWonGame(newBoard, playerTurn)) {
				setWinner(playerTurn);
			} else if (isDraw(newBoard)) {
				setWinner("Draw"); // Use string "Draw" to indicate a tie
			}

			return newBoard;
		});

		// Only change turn if game not over
		if (!winner) {
			setPlayerTurn((prev) => (prev === "X" ? "O" : "X"));
		}
	}

	function hasWonGame(board: string[][], player: "X" | "O"): boolean {
		const flatBoard = board.flat();
		for (const [a, b, c] of winningStates) {
			if (flatBoard[a] === player && flatBoard[b] === player && flatBoard[c] === player) {
				return true;
			}
		}

		return false;
	}

	function isDraw(board: string[][]) {
		let counter = 0;
		for (const row of board) {
			for (const col of row) {
				if (col) counter += 1;
			}
		}
		if (counter >= 9) return true;
		return false;
	}

	function startGame() {
		// 50/50 chance for player turn
		setPlayerTurn(Math.random() < 0.5 ? "X" : "O");
		setGameStarted(true);
	}

	function endGame() {
		setGameStarted(false);
		setWinner(null);
		setOpponent(null);
		setBoard(() => Array.from({ length: 3 }, () => ["", "", ""]));
	}

	const gameOptions = [
		{
			title: "Play Bots",
			subtitle: "Challenge a bot from Easy to Master",
			icon: <FaRobot className="text-primary w-6 h-6" />,
			onClick: () => {
				startGame();
				setOpponent("Bot");
			},
		},
		{
			title: "Play a Friend",
			subtitle: "Invite a friend to a quick match",
			icon: <FaUserFriends className="text-primary w-6 h-6" />,
			onClick: () => {
				console.log("Play a friend clicked");
			},
		},
	];

	return (
		<div
			className="
    w-full flex-1
    overflow-y-auto
    flex flex-col md:flex-row bg-background text-text
    
    "
		>
			{/* Game Preview Section */}
			<div className="flex-1 flex flex-col items-center justify-center p-6">
				<div className="bg-surface border-contrast border rounded-2xl shadow-md p-6 flex flex-col items-center max-w-md w-fit">
					<div
						className="flex items-center justify-center
          "
					>
						{!GameStarted && (
							<img
								src="/tictactoe-large.png"
								alt="Tic Tac Toe Board"
								className="rounded-2xl shadow-lg w-full h-auto object-cover"
							/>
						)}
						{GameStarted && (
							<div
								className="inline-grid grid-rows-3 border border-contrast
              size-[clamp(225px,50vw,400px)]
            "
							>
								{board.map((row, rowIdx) => (
									<div key={rowIdx} className="grid grid-cols-3 border border-contrast">
										{row.map((col, colIdx) => (
											<div
												onClick={() => place(rowIdx, colIdx)}
												key={`${rowIdx}-${colIdx}`}
												className="size-full bg-contrast
                        border border-contrast
                        flex items-center justify-center 
                      "
											>
												{col === "X" && (
													<>
														<img src={"/tictactoe/letter-x.png"} className="scale-65" />
													</>
												)}

												{col === "O" && (
													<>
														<img src={"/tictactoe/letter-o.png"} className="scale-65" />
													</>
												)}
											</div>
										))}
									</div>
								))}
							</div>
						)}
					</div>

					{GameStarted && (
						<div className="mt-4 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm font-semibold text-muted">
							{/* Opponent Info */}
							<div className="flex flex-col">
								<span className="text-muted uppercase text-xs tracking-wide">Opponent</span>
								<span className="text-foreground font-bold text-base">{opponent}</span>
							</div>

							{/* Current Turn / Game Status */}
							<div className="flex flex-col items-center">
								{winner ? (
									winner === "Draw" ? (
										<p className="text-2xl text-yellow-500 font-bold">It's a Draw!</p>
									) : (
										<p className="text-2xl text-success font-bold">{winner} Won!</p>
									)
								) : (
									<>
										<span className="text-muted uppercase text-xs tracking-wide">Current Turn</span>
										<span className={`font-bold text-base ${playerTurn === "X" ? "text-blue-500" : "text-red-500"}`}>
											@{playerTurn === "X" ? user.username : opponent}
										</span>
									</>
								)}
							</div>

							{/* Resign Button */}
							<button
								onClick={endGame}
								className="btn-secondary px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors text-sm font-semibold"
							>
								Resign
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Sidebar Section */}
			{!GameStarted && (
				<section className="block  bg-contrast border-t md:border-t-0 md:border-l border-border p-4 ">
					<h2 className="text-2xl font-bold text-foreground mb-6">Play Tic Tac Toe</h2>

					{/* Option: Play Bots */}
					{gameOptions.map((option, idx) => (
						<button
							key={idx}
							onClick={option.onClick}
							className="w-full flex items-center gap-4 p-4 rounded-xl bg-background hover:bg-secondary transition-all border border-border/50 mb-4"
						>
							<div className="bg-primary/10 p-3 rounded-lg">{option.icon}</div>
							<div className="flex flex-col text-left">
								<span className="font-semibold text-foreground">{option.title}</span>
								<span className="text-muted text-sm">{option.subtitle}</span>
							</div>
						</button>
					))}
				</section>
			)}
		</div>
	);
};

export default TicTacToeHome;
