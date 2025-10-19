"use client";
import { User } from "@/app/lib/definitions";
import React, { useEffect, useRef } from "react";

const SnakeHome = ({ user }: { user: User }) => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let ctx = canvas.getContext("2d");

		if (!ctx) {
			console.log("canvas not supported");
			return;
		}
		// This sets the fill color to red
		ctx.fillStyle = "rgb(200,0,0)";
		let currentPosition = { x: 50, y: 50 };

		// Sets the grid dimensions as one value
		const gridSize = 10;

		// This sets some variables for demonstration purposes
		let x = 50;
		let y = 50;
		let w = 10;
		let h = 10;

		// This draws a square with the parameters from the variables set above
		ctx.fillRect(x, y, w, h);
		ctx.strokeRect(100, 240, w, h);

		function snakeControls(event) {
			let keyCode;

			if (event == null) {
				keyCode = event.keyCode;
			} else {
				keyCode = event.keyCode;
			}

			switch (keyCode) {
				// left
				case 37:
					// set new position, and draw square at that position.
					currentPosition["x"] = currentPosition["x"] - gridSize;
					ctx.fillRect(currentPosition["x"], currentPosition["y"], gridSize, gridSize);
					break;

				// up
				case 38:
					currentPosition["y"] = currentPosition["y"] - gridSize;
					ctx.fillRect(currentPosition["x"], currentPosition["y"], gridSize, gridSize);
					break;

				// right
				case 39:
					currentPosition["x"] = currentPosition["x"] + gridSize;
					ctx.fillRect(currentPosition["x"], currentPosition["y"], gridSize, gridSize);
					break;

				// down
				case 40:
					currentPosition["y"] = currentPosition["y"] + gridSize;
					ctx.fillRect(currentPosition["x"], currentPosition["y"], gridSize, gridSize);
					break;

				default:
					break;
			}
		}

		window.addEventListener("keydown", snakeControls);
		return () => {
			window.removeEventListener("keydown", snakeControls);
		};
	}, []);

	return (
		<div>
			<canvas ref={canvasRef} id="canvas" width="400" height="400" className="border border-red-500"></canvas>
		</div>
	);
};

export default SnakeHome;
