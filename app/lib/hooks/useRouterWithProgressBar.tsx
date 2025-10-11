"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import NProgress from "nprogress";

NProgress.configure({
	showSpinner: false,
	minimum: 0.15,
	trickleSpeed: 150,
});

export function useRouterWithProgress() {
	const router = useRouter();

	const enhancedRouter = useMemo(() => {
		return {
			...router,
			push: async (...args: Parameters<typeof router.push>) => {
				NProgress.start();
				return router.push(...args);
			},
			replace: async (...args: Parameters<typeof router.replace>) => {
				NProgress.start();
				return router.replace(...args);
			},
			startProgress: () => NProgress.start(),
			doneProgress: () => NProgress.done(),
		};
	}, [router]);

	return enhancedRouter;
}
