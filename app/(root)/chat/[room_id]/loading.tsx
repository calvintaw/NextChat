import clsx from "clsx";
import React from "react";

export default function Loading({ className = "" }: { className?: string }) {
	const animationDelays = [0, 0.25, 0.5, 0.25, 0.0];
	const duration = 1;

	return (
		<div className={clsx("w-full h-full flex items-center justify-center", className)}>
			<div className="disable-scroll flex flex-items-center justify-center gap-2">
				{animationDelays.map((delay, index) => (
					<div
						key={index}
						className="w-1.5 h-18 bg-primary rounded-lg animate-scale"
						style={{
							animationDuration: `${duration}s`,
							animationDelay: `${delay}s`,
						}}
					></div>
				))}
			</div>
		</div>
	);
}
