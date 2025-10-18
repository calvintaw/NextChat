import { Route } from "next";
import Link from "next/link";
import React, { useState } from "react";

interface GameCardProps {
	imgSrc: string; // URL or import of image (SVG or PNG)
	title: string; // Game title
	description: string;
	href: Route; // Short description
}

const GameCard = ({ imgSrc, title, description, href }: GameCardProps) => {
	return (
		<div className="rounded-xl border border-contrast p-2 py-3 shadow-md shadow-black/70 not-dark:shadow-black/35 min-w-75 max-w-100 bg-transparent">
			<div className="flex gap-2 items-start">
				<img src={imgSrc} alt={title} className="size-25 object-cover" />
				<div className="flex-1">
					<h3 className="text-lg font-semibold text-text">{title}</h3>
					<p className={`mt-1 text-sm text-muted line-clamp-2 break-all break-words`}>{description}</p>
					<div className="flex gap-2 mt-2">
						<Link href={href} className="no-underline">
							<button className="btn-third">Play</button>
						</Link>
						<button className="btn-secondary-border">Like</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default GameCard;
