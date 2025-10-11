"use client";

import { useEffect } from "react";
import { useLocalStorage } from "./useStorage";

export default function useDarkMode() {
	
	const [darkMode, setDarkMode] = useLocalStorage("useDarkMode", true);

	const toggle = (value) => {
		setDarkMode((prev) => (typeof value === "boolean" ? value : !prev));
	};

	useEffect(() => {
		const update = () => {
			if (typeof window === "undefined") return;
			document.documentElement.classList.toggle("dark", darkMode);

			fetch("/api/theme", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ theme: darkMode ? "dark" : "" }),
			});
		};

		update();
	}, [darkMode]);

	return [darkMode, toggle];
}
