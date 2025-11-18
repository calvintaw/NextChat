"use client";
import React from "react";

type MessageSkeletonProps = {
	count?: number; // number of skeleton messages to render
};

export default function MessageSkeleton({ count = 5 }: MessageSkeletonProps) {
	return (
		<div className="flex flex-col space-y-4 p-4 animate-pulse">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="flex items-start gap-3">
					{/* Avatar */}
					<div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full"></div>

					{/* Message body */}
					<div className="flex-1 space-y-2">
						{/* Header: username + time */}
						<div className="flex items-center gap-2">
							<div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
							<div className="h-2.5 w-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
						</div>

						{/* Randomized message line structure for variety */}
						{i % 3 === 0 ? (
							<>
								<div className="h-3.5 w-3/4 bg-gray-300 dark:bg-gray-700 rounded"></div>
								<div className="h-3.5 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
							</>
						) : i % 3 === 1 ? (
							<>
								<div className="h-3.5 w-4/5 bg-gray-300 dark:bg-gray-700 rounded"></div>
								<div className="h-3.5 w-2/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
								<div className="h-3.5 w-1/3 bg-gray-300 dark:bg-gray-700 rounded"></div>
							</>
						) : (
							/* Simulate image/video message with grid */
							<div className="grid grid-cols-2 gap-2 w-3/4">
								<div className="aspect-square bg-gray-300 dark:bg-gray-700 rounded-md"></div>
								<div className="aspect-square bg-gray-300 dark:bg-gray-700 rounded-md"></div>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
