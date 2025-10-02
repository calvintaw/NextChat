"use client";

import { useEffect } from "react";
import { useLocalStorage } from "./useStorage";

export default function useStarsBg() {
	const [starsBackgroundEnabled, setStarsBackgroundEnabled] = useLocalStorage("starsBackgroundEnabled");

	const toggle = (value) => {
		setStarsBackgroundEnabled((prev) => (typeof value === "boolean" ? value : !prev));
	};

	useEffect(() => {
		const update = () => {
			if (typeof window === "undefined") return;
			document.documentElement.classList.toggle("disable-stars-bg", !starsBackgroundEnabled);

			fetch("/api/stars", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ starsBackgroundEnabled: !starsBackgroundEnabled ? "disable-stars-bg" : "" }),
			});
		};

		update();
	}, [starsBackgroundEnabled]);

	return [starsBackgroundEnabled, toggle];
}
