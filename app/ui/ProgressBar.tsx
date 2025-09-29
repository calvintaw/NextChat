"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";

NProgress.configure({
	showSpinner: false,
	minimum: 0.15,
});

export default function ProgressBar() {
	const pathname = usePathname();
	const timeouts = useRef<number[]>([]); // store timeout IDs

	const normalizePath = (url: string) => {
		try {
			const u = new URL(url, window.location.origin);
			return u.pathname.replace(/\/+$/, ""); // remove trailing slash
		} catch {
			return url;
		}
	};

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null;

			if (target?.closest("#remove-friend-btn-contact-card")) {
				return;
			}

			const anchor = target?.closest("a");

			// Stop NProgress after 200ms
			// const timeoutId = window.setTimeout(() => {
			// 	NProgress.done();
			// }, 5000);

			// timeouts.current.push(timeoutId);

			// Only trigger for in-app navigation
			if (anchor && anchor.href && !anchor.target && anchor.getAttribute("href")?.startsWith("/")) {
				const anchorUrl = new URL(anchor.href);

				const clickedPath = normalizePath(anchor.href);
				const currentPath = normalizePath(window.location.pathname);

				if (anchorUrl.pathname === pathname || clickedPath === currentPath) {
					console.log("Already on the same page, skipping NProgress");
					return;
				}

				NProgress.start();
				NProgress.set(0.5);
				NProgress.set(0.75);
			}
		};

		document.addEventListener("click", handleClick);

		return () => {
			document.removeEventListener("click", handleClick);
			// Clear all pending timeouts to avoid memory leaks
			timeouts.current.forEach((t) => clearTimeout(t));
			timeouts.current = [];
		};
	}, []);

	// When pathname changes → navigation finished → stop NProgress
	useEffect(() => {
		if (!pathname) return;
		NProgress.done();
	}, [pathname]);

	return null;
}
