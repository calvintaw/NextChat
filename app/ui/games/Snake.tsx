"use client";

import React, { useEffect, useRef, useState } from "react";
import { User } from "@/app/lib/definitions";

const gridSize = 10;
const canvasWidth = 400;
const canvasHeight = 400;

export default function SnakeHome({ user }: { user: User }) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const [snakeBody, setSnakeBody] = useState<[number, number][]>([]);
	const [snakeLength, setSnakeLength] = useState(3);
	const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("right");
	const [food, setFood] = useState<[number, number]>([100, 100]);
	const [running, setRunning] = useState(false);

	// --- Draw everything
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw snake
		ctx.fillStyle = "rgb(200,0,0)";
		snakeBody.forEach(([x, y]) => ctx.fillRect(x, y, gridSize, gridSize));

		// Draw food
		ctx.fillStyle = "rgb(10,100,0)";
		ctx.fillRect(food[0], food[1], gridSize, gridSize);
	}, [snakeBody, food]);

	// --- Snake movement logic
	useEffect(() => {
		if (!running) return;
		intervalRef.current = setInterval(moveSnake, 120);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [snakeBody, direction, running]);

	// --- Key controls
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (!running) return;
			switch (e.key) {
				case "ArrowUp":
					if (direction !== "down") setDirection("up");
					break;
				case "ArrowDown":
					if (direction !== "up") setDirection("down");
					break;
				case "ArrowLeft":
					if (direction !== "right") setDirection("left");
					break;
				case "ArrowRight":
					if (direction !== "left") setDirection("right");
					break;
			}
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [direction, running]);

	// --- Core movement
	function moveSnake() {
		if (snakeBody.length === 0) return;
		const head = snakeBody[snakeBody.length - 1];
		let newHead: [number, number] = [...head];

		switch (direction) {
			case "up":
				newHead = [head[0], head[1] - gridSize];
				break;
			case "down":
				newHead = [head[0], head[1] + gridSize];
				break;
			case "left":
				newHead = [head[0] - gridSize, head[1]];
				break;
			case "right":
				newHead = [head[0] + gridSize, head[1]];
				break;
		}

		// Wall collision
		if (
			newHead[0] < 0 ||
			newHead[1] < 0 ||
			newHead[0] >= canvasWidth ||
			newHead[1] >= canvasHeight ||
			snakeBody.some(([x, y]) => x === newHead[0] && y === newHead[1])
		) {
			gameOver();
			return;
		}

		let newBody = [...snakeBody, newHead];
		// Eat food
		if (newHead[0] === food[0] && newHead[1] === food[1]) {
			setSnakeLength((len) => len + 1);
			spawnFood(newBody);
		} else {
			while (newBody.length > snakeLength) newBody.shift();
		}
		setSnakeBody(newBody);
	}

	function spawnFood(currentSnake: [number, number][]) {
		let newFood: [number, number];
		do {
			newFood = [
				Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize,
				Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize,
			];
		} while (currentSnake.some(([x, y]) => x === newFood[0] && y === newFood[1]));
		setFood(newFood);
	}

	function startGame() {
		setSnakeBody([
			[50, 50],
			[60, 50],
			[70, 50],
		]);
		setDirection("right");
		setSnakeLength(3);
		spawnFood([
			[50, 50],
			[60, 50],
			[70, 50],
		]);
		setRunning(true);
	}

	function pauseGame() {
		setRunning(false);
	}

	function unPauseGame() {
		setRunning(true);
	}

	function restartGame() {
		setRunning(false);
		startGame();
	}

	function clearCanvas() {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
		setSnakeBody([]);
		setRunning(false);
	}

	function gameOver() {
		setRunning(false);
		alert(`Game Over! Your score: ${(snakeLength - 3) * 10}`);
	}

	return (
		<div className="flex flex-col items-center gap-3">
			<canvas
				ref={canvasRef}
				width={canvasWidth}
				height={canvasHeight}
				className="border border-red-500 rounded-md"
			></canvas>

			<div className="flex gap-2">
				<button className="btn btn-secondary" onClick={startGame}>
					Start
				</button>
				<button className="btn btn-secondary" onClick={() => (running ? pauseGame() : unPauseGame())}>
					{running ? "Pause" : "Unpause"}
				</button>
				<button className="btn btn-secondary" onClick={restartGame}>
					Restart
				</button>
				<button className="btn btn-error" onClick={clearCanvas}>
					Clear Canvas
				</button>
			</div>
		</div>
	);
}
