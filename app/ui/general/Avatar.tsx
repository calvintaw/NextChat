"use client";

import { getBackgroundColorByInitial } from "@/app/lib/utilities";
import clsx from "clsx";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RiLoader3Line } from "react-icons/ri";
import { Tooltip } from "react-tooltip";

type AvatarProps = {
	src: string;
	border?: string;
	id?: string;
	size?: string;
	displayName: string;
	status?: boolean | "loading";
	fontSize?: string;
	statusIndicator?: boolean;
	radius?: string;
	parentClassName?: string;
	disableTooltip?: boolean;
	onParentClick?: () => void;
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">; // Omit conflicting src type

type UserLinkProps = {
	id: string;
	disable?: boolean;
	children: React.ReactNode;
};

const UserLink = ({ id, disable = false, children }: UserLinkProps) => {
	if (disable) {
		return <>{children}</>;
	}

	return <Link href={`/users/${id}`}>{children}</Link>;
};

export const Avatar = ({
	onParentClick = () => {},
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
	disableTooltip = false,
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
				<div
					onClick={onParentClick}
					data-tooltip-id={disableTooltip ? undefined : "avatar-tooltip"}
					data-tooltip-content={disableTooltip ? undefined : `View ${displayName}'s profile`}
					className={clsx("relative", size, parentClassName)}
				>
					<UserLink id={id} disable={disableTooltip}>
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
								" relative shrink-0 z-0 object-cover flex items-center justify-center text-white",
								size,
								radius,
								border,
								getBackgroundColorByInitial(displayName),
								!loaded ? "opacity-0" : "opacity-100",
								!disableTooltip && "cursor-pointer"
							)}
							loading="lazy"
							onLoad={() => setLoaded(true)}
							onError={() => setLoaded(false)}
							{...rest}
						/>
						{statusIndicator && (
							<div className={clsx(onlineStatusContainer, status === "loading" && "!bg-background")}>
								{typeof status === "boolean" && (
									<div className={clsx(onlineStatusBulb, status ? "bg-emerald-500" : "bg-red-400")} />
								)}
								{status === "loading" && (
									<RiLoader3Line className="text-2xl animate-spin text-foreground"></RiLoader3Line>
								)}
							</div>
						)}
					</UserLink>
				</div>
			)}

			{!hasValidSrc && (
				<div
					onClick={onParentClick}
					data-tooltip-id="avatar-tooltip"
					data-tooltip-content={`View ${displayName}'s profile`}
					className={clsx("relative", size, parentClassName)}
				>
					<UserLink id={id} disable={disableTooltip}>
						<div
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
					</UserLink>
				</div>
			)}
		</>
	);
};
