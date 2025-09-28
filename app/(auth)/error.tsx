"use client";

import React from "react";
import Link from "next/link";
import { FaExclamationTriangle } from "react-icons/fa";
import { MdArrowBack } from "react-icons/md";
import clsx from "clsx";
import { Button } from "../ui/general/Buttons";

export default function ErrorPage({ className = "" }: { className?: string }) {
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
			<h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Something went wrong</h1>
			<p className="text-lg text-gray-600 dark:text-gray-400">
				We couldn’t find the page you were looking for, or an unexpected error occurred.
			</p>

			{/* Go back home */}
			<Link
				href="/"
				className="
				no-underline
				flex items-center px-3 py-1 gap-2 btn bg-primary text-text rounded-lg shadow hover:bg-primary/90 transition
				"
			>
				<MdArrowBack className="text-xl " />
				<span>Back to Home</span>
			</Link>
		</div>
	);
}
