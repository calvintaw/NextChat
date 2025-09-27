"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

export default function ProgressBar() {
	const pathname = usePathname();

	useEffect(() => {
		NProgress.configure({
			showSpinner: false,
			minimum: 0.15,
		});

		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;
			const anchor = target?.closest("a");

			// Only trigger for in-app navigation
			if (anchor && anchor.href && !anchor.target && anchor.getAttribute("href")?.startsWith("/")) {
				NProgress.start();
				NProgress.set(0.5);
				NProgress.set(0.75);
			}
		};

		document.addEventListener("click", handleClick);
		return () => {
			document.removeEventListener("click", handleClick);
		};
	}, []);

	// When pathname changes → navigation finished → stop NProgress
	useEffect(() => {
		if (!pathname) return;
		NProgress.done();
	}, [pathname]);

	return null;
}
