"use client";
import { useEffect, useState } from "react";

export default function useOnScreen(
	ref: React.RefObject<HTMLElement | null>,
	rootMargin: string = "0px",
	enabled: boolean = true
) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (ref.current == null || !enabled || !ref) return;
		const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { rootMargin });
		observer.observe(ref.current);
		return () => {
			if (ref.current == null) return;
			observer.unobserve(ref.current);
		};
	}, [rootMargin, enabled]);

	return isVisible;
}
