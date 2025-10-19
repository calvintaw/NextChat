"use client";
import { usePathProvider } from "@/app/lib/PathContext";
import type { User } from "@/app/lib/definitions";
import React, { useEffect, useState } from "react";
import { FaRobot, FaUserFriends } from "react-icons/fa";
import * as Dialog from "@radix-ui/react-dialog";
import { Avatar } from "../general/Avatar";
import { getOnlineFriends } from "@/app/lib/actions";
import * as Tabs from "@radix-ui/react-tabs";

import clsx from "clsx";

const exampleFriends: User[] = [
	{
		id: "friend1",
		image: "/images/friend1.png",
		username: "alice123",
		displayName: "Alice Johnson",
		email: "alice@example.com",
		createdAt: "2024-01-15",
		bio: "Loves board games and coding.",
	},
	{
		id: "friend2",
		image: "/images/friend2.png",
		username: "bob_the_gamer",
		displayName: "Bob Smith",
		email: "bob@example.com",
		createdAt: "2023-11-02",
		bio: "Always up for a challenge.",
	},
];

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
	const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

	const [userSymbol, setUserSymbol] = useState<"X" | "O">("X");
	const [opponent, setOpponent] = useState<string | null>(null);
	const [winner, setWinner] = useState<"X" | "O" | "Draw" | null>(null);
	const [board, setBoard] = useState<string[][]>(() => Array.from({ length: 3 }, () => ["", "", ""]));
	const [onlineFriends, setOnlineFriends] = useState<User[]>([]);
	const [isPending, setIsPending] = useState(false);
	const botMessages = [
		"Better luck next time!",
		"I'm unstoppable!",
		"Close, but not close enough!",
		"You almost got me!",
		"Haha, easy win!",
		"Try again!",
		"You can't beat me!",
		"I'm learning fast!",
		"Not bad, but I win!",
		"Next time, maybe!",
	];

	const [statusMessage, setStatusMessage] = useState<string | null>(null);

	useEffect(() => {
		setPath("TicTacToe");
	}, [setPath]);

	async function place(rowIdx: number, colIdx: number) {
		if (board[rowIdx][colIdx] || winner) return;

		const newBoard = board.map((row) => [...row]);
		newBoard[rowIdx][colIdx] = playerTurn;

		if (hasWonGame(newBoard, playerTurn)) {
			setBoard(newBoard);
			setWinner(playerTurn);
			if (opponent === "Bot" && playerTurn !== userSymbol) {
				const msg = botMessages[Math.floor(Math.random() * botMessages.length)];
				setStatusMessage(`Bot wins! ${msg}`);
			} else {
				setStatusMessage("You win! 🎉");
			}
			return;
		}

		if (isDraw(newBoard)) {
			setBoard(newBoard);
			setWinner("Draw");
			setStatusMessage("It's a draw! 🤝");
			return;
		}

		setBoard(newBoard);

		// Switch turn for player
		setPlayerTurn((prev) => (prev === "X" ? "O" : "X"));

		if (opponent === "Bot") {
			await new Promise((resolve) => setTimeout(resolve, 750));
			const botSymbol = userSymbol === "X" ? "O" : "X";
			const move = botMove(newBoard, botSymbol);
			if (move) {
				const [r, c] = move;
				newBoard[r][c] = botSymbol;

				if (hasWonGame(newBoard, botSymbol)) {
					setWinner(botSymbol);
					const msg = botMessages[Math.floor(Math.random() * botMessages.length)];
					setStatusMessage(`Bot wins! ${msg}`);
				} else if (isDraw(newBoard)) {
					setWinner("Draw");
					setStatusMessage("It's a draw! 🤝");
				}

				setBoard([...newBoard]);
				setPlayerTurn(botSymbol === "X" ? "O" : "X");
			}
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
		return board.flat().every((cell) => cell !== "");
	}

	function endGame() {
		setPlayerTurn("X");
		setUserSymbol("X");
		setOpponent(null);
		setGameStarted(false);
		setWinner(null);
		setBoard(Array.from({ length: 3 }, () => ["", "", ""]));
		setStatusMessage(null);
	}

	function sendInvite() {}

	function botMove(currentBoard: string[][], botSymbol: "X" | "O") {
		const opponent = botSymbol === "X" ? "O" : "X";
		const flat = currentBoard.flat();

		if (Math.random() < 0.25) {
			const emptySpots = flat.map((v, i) => (!v ? i : -1)).filter((i) => i !== -1);
			if (emptySpots.length > 0) {
				const randomIndex = emptySpots[Math.floor(Math.random() * emptySpots.length)];
				return [Math.floor(randomIndex / 3), randomIndex % 3];
			}
		}

		// Try to win
		for (const [a, b, c] of winningStates) {
			const line = [flat[a], flat[b], flat[c]];
			if (line.filter((v) => v === botSymbol).length === 2 && line.includes("")) {
				const idx = [a, b, c][line.indexOf("")];
				return [Math.floor(idx / 3), idx % 3];
			}
		}

		// Block opponent
		for (const [a, b, c] of winningStates) {
			const line = [flat[a], flat[b], flat[c]];
			if (line.filter((v) => v === opponent).length === 2 && line.includes("")) {
				const idx = [a, b, c][line.indexOf("")];
				return [Math.floor(idx / 3), idx % 3];
			}
		}

		if (!flat[4]) return [1, 1];

		const corners = [0, 2, 6, 8];
		const availableCorner = corners.find((i) => !flat[i]);
		if (availableCorner !== undefined) {
			return [Math.floor(availableCorner / 3), availableCorner % 3];
		}

		for (let i = 0; i < 9; i++) {
			if (!flat[i]) return [Math.floor(i / 3), i % 3];
		}

		return null;
	}

	function botFirstMove(botSymbol: "X" | "O") {
		const newBoard = board.map((row) => [...row]);
		const move = botMove(newBoard, botSymbol);
		if (move) {
			const [r, c] = move;
			newBoard[r][c] = botSymbol;
			setBoard(newBoard);
			setPlayerTurn(botSymbol === "X" ? "O" : "X"); // correctly switch to player's turn
		}
	}

	return (
		<div className="w-full flex-1 overflow-y-auto flex flex-col md:flex-row bg-background text-text relative">
			{statusMessage && (
				<div className="w-full h-fit absolute top-0 left-0 right-0 text-center py-1 text-sm font-semibold bg-yellow-200 text-yellow-900">
					{statusMessage}
				</div>
			)}

			{/* Game Preview Section */}
			<div className="flex-1 flex flex-col items-center justify-center p-6">
				<div className="bg-surface border-contrast border rounded-2xl shadow-md p-6 flex flex-col items-center max-w-md w-fit">
					<div className="flex items-center justify-center">
						{!GameStarted && (
							<img
								src="/tictactoe/tictactoe-large.png"
								alt="Tic Tac Toe Board"
								className="rounded-2xl shadow-lg w-full h-auto object-cover"
							/>
						)}
						{GameStarted && (
							<div className="inline-grid grid-rows-3 border border-contrast size-[clamp(225px,50vw,400px)]">
								{board.map((row, rowIdx) => (
									<div key={rowIdx} className="grid grid-cols-3 border border-contrast">
										{row.map((col, colIdx) => (
											<div
												onClick={() => {
													if (playerTurn !== userSymbol) return;
													place(rowIdx, colIdx);
												}}
												key={`${rowIdx}-${colIdx}`}
												className="size-full bg-contrast border border-contrast flex items-center justify-center"
											>
												{col === "X" && <img src={"/tictactoe/letter-x.png"} className="scale-65" />}
												{col === "O" && <img src={"/tictactoe/letter-o.png"} className="scale-65" />}
											</div>
										))}
									</div>
								))}
							</div>
						)}
					</div>

					{GameStarted && (
						<div className="mt-4 w-full flex flex-row items-center justify-between gap-3 text-sm font-semibold text-muted">
							<div className="flex flex-col">
								<span className="text-muted uppercase text-xs tracking-wide">Opponent</span>
								<span className="text-foreground font-bold text-base">{opponent}</span>
							</div>

							<div className="flex flex-col items-center">
								{winner ? (
									winner === "Draw" ? (
										<p className="text-2xl text-yellow-500 font-bold">It's a Draw!</p>
									) : (
										<p className="text-2xl text-success font-bold">{winner} Won!</p>
									)
								) : (
									<>
										<span className="text-muted uppercase text-xs tracking-wide whitespace-nowrap text-nowrap">
											Current Turn
										</span>
										<span
											className={`font-bold text-base ${userSymbol === playerTurn ? "text-blue-500" : "text-red-500"}`}
										>
											@
											{userSymbol === playerTurn ? (
												<>
													{user.username} <span className="text-xs text-muted">{"(You)"}</span>
												</>
											) : (
												opponent
											)}
										</span>
									</>
								)}
							</div>

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
				<section className="md:w-fit bg-contrast border-t md:border-t-0 md:border-l max-md:pb-10 border-border p-4 h-full flex flex-col justify-between">
					<div>
						<h2 className="text-2xl font-bold text-foreground mb-6">Play Tic Tac Toe</h2>

						<Tabs.Root value={activeTab ?? "default"} onValueChange={setActiveTab}>
							{/* Hidden triggers just to satisfy Radix */}
							<Tabs.List>
								<Tabs.Trigger value="play-bot" asChild>
									<button
										onClick={() => setActiveTab("play-bot")}
										className="w-full flex items-center md:max-w-[320px] gap-4 p-4 rounded-xl bg-background hover:bg-secondary transition-all border border-border/50 mb-2 "
									>
										<div className="bg-primary/10 p-3 rounded-lg">
											<FaRobot className="text-primary w-6 h-6 text-2xl" />
										</div>
										<div className="flex flex-col text-left">
											<span className="font-semibold text-foreground">Play Bots</span>
											<span className="text-muted text-sm">Challenge a bot from Easy to Master</span>
										</div>
									</button>
								</Tabs.Trigger>
							</Tabs.List>
							<Dialog.Root>
								<Dialog.Trigger asChild>
									<button
										onClick={async () => {
											setIsPending(true);
											const friends = await getOnlineFriends(user.id);
											setOnlineFriends(friends);
											setIsPending(false);
										}}
										disabled
										className="w-full flex items-center md:max-w-[320px] gap-4 p-4 rounded-xl bg-background hover:bg-secondary transition-all border border-border/50 disabled:opacity-50 cursor-not-allowed"
									>
										<div className="bg-primary/10 p-3 rounded-lg">
											<FaUserFriends className="text-primary w-6 h-6 text-2xl" />
										</div>
										<div className="flex flex-col text-left">
											<span className="font-semibold text-foreground">Play a Friend</span>
											<span className="text-muted text-sm text-wrap break-words">
												Invite a friend to a quick match (Under Construction)
											</span>
										</div>
									</button>
								</Dialog.Trigger>

								<Dialog.Portal>
									<Dialog.Overlay className="fixed inset-0 bg-black/50 z-[10000]" />
									<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-md shadow-lg border border-border z-[12000]">
										<Dialog.Title className="text-base font-semibold text-foreground">Online Friends</Dialog.Title>
										<Dialog.Description className="sr-only">
											Invite a friend to play Tic Tac Toe. You can select any online friend and send them a game invite.
										</Dialog.Description>

										<hr className="hr-separator my-2 bg-transparent border-contrast border" />
										{(!isPending ? onlineFriends : Array(2).fill(null)).map((friend, idx) => (
											<div
												key={friend?.id ?? idx}
												className={clsx(
													"rounded-lg h-15 px-2.5 hover:bg-secondary/75 flex items-center gap-2.5 group/contact",
													!friend?.id && "bg-secondary/75 mb-1.5"
												)}
											>
												<div className="h-full mr-1 flex flex-row py-3">
													{friend ? (
														<Avatar
															statusIndicator={true}
															id={friend.id}
															src={friend.image}
															size="size-8"
															status={true}
															displayName={friend.displayName}
														/>
													) : (
														<div className="bg-surface animate-pulse w-8 h-8 rounded-full" />
													)}
												</div>

												<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate leading-tight">
													{friend ? (
														<>
															<p className="text-base m-0">{friend.displayName}</p>
															<p className="text-muted text-[13.5px] -mt-0.5">{friend.username}</p>
														</>
													) : (
														<>
															<div className="h-4 bg-surface animate-pulse rounded w-3/4 mb-1"></div>
															<div className="h-3 bg-surface animate-pulse rounded w-1/2"></div>
														</>
													)}
												</div>

												{friend && (
													<button className="align-end btn-secondary-border" onClick={() => sendInvite()}>
														Invite
													</button>
												)}
											</div>
										))}
										{onlineFriends.length <= 0 && !isPending && (
											<div className="flex flex-col items-center justify-center text-center py-10 px-4">
												<div className="bg-secondary/40 rounded-full p-4 mb-3">
													<FaUserFriends className="w-8 h-8 text-muted" />
												</div>
												<p className="text-muted text-base font-medium">Looks like no one is online today</p>
												<p className="text-xs text-muted/70 mt-1">
													Try again later or invite a friend to join your game!
												</p>
											</div>
										)}
									</Dialog.Content>
								</Dialog.Portal>
							</Dialog.Root>

							{/* Play Bots Content */}
							<Tabs.Content value="play-bot" asChild>
								<div className="flex flex-col items-center gap-4 mt-6">
									<p className="text-lg font-semibold">Choose your symbol</p>
									<div className="flex gap-4">
										<button
											onClick={() => {
												setPlayerTurn("X");
												setUserSymbol("X");
												setOpponent("Bot");
												setGameStarted(true);
											}}
											className="btn-primary px-4 py-2"
										>
											X (go first)
										</button>
										<button
											onClick={() => {
												setPlayerTurn("O");
												setUserSymbol("O");
												setOpponent("Bot");
												setGameStarted(true);
												setTimeout(() => botFirstMove("X"), 200);
											}}
											className="btn-primary px-4 py-2"
										>
											O (go second)
										</button>
									</div>
								</div>
							</Tabs.Content>

							<Tabs.Content value="default"></Tabs.Content>
						</Tabs.Root>
					</div>

					{activeTab && (
						<button onClick={() => setActiveTab(undefined)} className="btn-secondary-border mt-auto max-md:mt-15">
							Cancel
						</button>
					)}
				</section>
			)}
		</div>
	);
};

export default TicTacToeHome;
