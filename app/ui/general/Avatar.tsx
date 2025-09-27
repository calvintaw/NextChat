"use client";

import { getBackgroundColorByInitial } from "@/app/lib/utilities";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

type AvatarProps = {
	src: string;
	border?: string;
	id?: string;
	size?: string;
	displayName: string;
	status?: boolean;
	fontSize?: string;
	statusIndicator?: boolean;
	radius?: string;
	parentClassName?: string;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">; // Omit conflicting src type

export const Avatar = ({
	src,
	fontSize = "text-base",
	radius = "rounded-full",
	displayName,
	id = "",
	border = "",
	size = "size-9.5",
	statusIndicator = true,
	status = false,
	parentClassName = "",
	...rest
}: AvatarProps) => {
	const hasValidSrc = typeof src === "string" && src.trim() !== "";

	const onlineStatusContainer = `absolute size-4 -bottom-0.5 -right-0.5 flex items-center justify-center bg-surface ${radius}`;
	const onlineStatusBulb = ` size-2.5 ${radius}`;

	let fallback = "";
	if (displayName) {
		fallback = displayName?.charAt(0)?.toUpperCase() + displayName.split(" ").pop()?.charAt(0).toLowerCase();
	}

	const [loaded, setLoaded] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	const handleImgLoad = () => {
		setLoaded(true);
	};

	useEffect(() => {
		if (imgRef.current) {
			if (imgRef.current.complete) {
				handleImgLoad();
			} else {
				imgRef.current.onload = handleImgLoad;
			}
		}
	}, [src]);

	return (
		<>
			{hasValidSrc && (
				<div className={clsx("relative", size, parentClassName)}>
					{!loaded && (
						<div
							className={clsx(
								"absolute top-0 left-0 w-full h-full transition-opacity duration-500",
								"bg-gray-500 not-dark:bg-gray-300",
								{
									"animate-pulse": !loaded,
									"opacity-0 pointer-events-none": loaded,
								},
								radius,
								size
							)}
						></div>
					)}

					<img
						ref={imgRef}
						src={src}
						alt={displayName.charAt(0) ?? "A"}
						className={clsx(
							"cursor-pointer relative shrink-0 z-0 object-cover flex items-center justify-center text-white",
							size,
							radius,
							border,
							getBackgroundColorByInitial(displayName),
							!loaded ? "opacity-0" : "opacity-100"
						)}
						loading="lazy"
						onLoad={() => setLoaded(true)}
						onError={() => setLoaded(false)}
						{...rest}
					/>
					{statusIndicator && (
						<div className={onlineStatusContainer}>
							<div className={clsx(onlineStatusBulb, status ? "bg-emerald-500" : "bg-red-400")} />
						</div>
					)}
				</div>
			)}

			{!hasValidSrc && (
				<div className={clsx("relative", size, parentClassName)}>
					<div
						role="img"
						className={clsx(
							"relative shrink-0  z-0 flex items-center justify-center text-white",
							size,
							radius,
							border,
							getBackgroundColorByInitial(displayName)
						)}
					>
						<span className={clsx("font-medium", fontSize)}>{fallback}</span>
					</div>
					{statusIndicator && (
						<div className={onlineStatusContainer}>
							<div className={clsx(onlineStatusBulb, status ? "bg-emerald-500" : "bg-red-400")} />
						</div>
					)}
				</div>
			)}
		</>
	);
};
