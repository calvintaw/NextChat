"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import clsx from "clsx";
import { Button } from "../ui/general/Buttons";

export default function ErrorPage({
	error,
	reset,
	className = "",
}: {
	error: Error & { digest?: string };
	reset: () => void;
	className?: string;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	// Extract text inside square brackets (only present in my custom throw new error statements)
	// Split error.message into main text and bracketed digest
	const disableReload = error.message?.includes("[disableReload]");
	const { mainMessage, digest } = (() => {
		const match = error.message.match(/^(.*?)\s*\[([^\]]+)\]/);
		if (match) {
			return { mainMessage: match[1].trim(), digest: match[2].trim() };
		}
		return {
			mainMessage: "Something went wrong",
			digest: "We couldn’t find the page you were looking for, or an unexpected error occurred.",
		};
	})();

	return (
		<div
			className={clsx(
				"w-full h-full flex-1 flex flex-col items-center justify-center text-center gap-6 px-4",
				className
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
				flex items-center px-3 py-1 gap-2 btn bg-primary rounded-lg shadow text-white hover:bg-primary/90 transition h-9
        "
				>
					<MdArrowBack className="text-xl " />
					<span>Back to Home</span>
				</Link>
				<Button
					disabled={disableReload}
					className={clsx("btn-inverted h-9", disableReload && "opacity-50 cursor-not-allowed")}
					onClick={() => reset()}
				>
					Reload
				</Button>
			</div>
		</div>
	);
}
