"use client";
import "./globals.css";
import localFont from "next/font/local";

import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import clsx from "clsx";
import useDarkMode from "./lib/hooks/useDarkMode";
import useStarsBg from "./lib/hooks/useStarsBg";

const roboto = localFont({
	src: [
		{
			path: "../public/fonts/Roboto-Regular.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../public/fonts/Roboto-Bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-roboto",
	display: "swap",
});

export default function GlobalNotFound() {
	const mainMessage = "Oops! Something went wrong.";
	const digest = "Try refreshing the page or head back home while we fix this.";
	const [darkMode] = useDarkMode();
	const [starsBackgroundEnabled] = useStarsBg();

	return (
		<html
			lang="en"
			className={`${darkMode ? "dark" : ""} h-full min-h-screen ${starsBackgroundEnabled ? "" : "disable-stars-bg"}`}
		>
			<body
				className={clsx(
					"w-full h-full flex-1 flex flex-col items-center justify-center text-center gap-6 px-4",
					roboto.className
				)}
			>
				{/* Icon */}
				<div className="text-amber-500 text-6xl animate-bounce">
					<FaExclamationTriangle />
				</div>

				{/* Error Text */}
				<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{mainMessage}</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400">{digest}</p>

				{/* Go back home */}
				<div className="flex gap-2">
					<Link
						href="/"
						className="
        no-underline
        flex items-center px-3 py-1 gap-2 btn bg-primary rounded-lg shadow text-white hover:bg-primary/90 transition
        "
					>
						<MdArrowBack className="text-xl " />
						<span>Back to Home</span>
					</Link>
				</div>
			</body>
		</html>
	);
}
