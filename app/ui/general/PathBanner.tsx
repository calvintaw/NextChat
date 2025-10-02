"use client";
import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePathProvider } from "@/app/lib/PathContext";

export const PathBanner = () => {
	const pathname = usePathname();
	const { path } = usePathProvider();

	const pathDisplayNameMap: { [key: string]: string } = {
		"/discover": "🔍 Discover",
		"/": "🖥️ Main Dashboard",
		"/news": "📰 Top News",
		"/dashboard": "👤 Profile",
	};

	const getBannerTitle = (pathname: string): string => {
		if (pathDisplayNameMap[pathname]) {
			return pathDisplayNameMap[pathname];
		}

		return path === "" ? "Explore" : path;
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

	// max-w-86

	return (
		<div
			id="path-banner"
			className="hidden lg:block p-1 w-full  text-center 
			text-base text-muted font-sans font-semibold
			border-contrast
			max-lg:border-l
			max-lg:left-15.5
			max-sm:left-13
			"
		>
			{banner}
		</div>
	);
};
