"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";

export const PathBanner = () => {
	const pathname = usePathname();

	const pathDisplayNameMap: { [key: string]: string } = {
		"/discover": "Discover",
		"/": "Main Dashboard",
		"/news": "Top News",
		"/dashboard/friends": "Friends",
	};

	const getBannerTitle = (pathname: string): string => {

		if (pathDisplayNameMap[pathname]) {
			return pathDisplayNameMap[pathname];
		}

		if (pathname.includes("@me:")) {
			return "Chat with friends"
		}

		return "Explore";
	};

	const banner = getBannerTitle(pathname);

	useEffect(() => {
		if (typeof window === "undefined") return; 

		const handleClick = (e: MouseEvent) => {
			const sidebar = document.getElementById("sidebar");
			if (!sidebar) return;

			const target = e.target as HTMLElement;
			if (!sidebar.contains(target) && sidebar.classList.contains("active")) {
				sidebar.classList.remove("active");
			}
		};

		window.addEventListener("click", handleClick);

		return () => {
			window.removeEventListener("click", handleClick);
		};
	}, []);


	return (
		<div
			id="path-banner"
				className="hidden lg:block p-1 w-full max-w-86 text-center border-contrast border-b-1 border-r-2
			text-xl font-sans font-semibold
			"
			>
				{banner}
			</div>
	);
};