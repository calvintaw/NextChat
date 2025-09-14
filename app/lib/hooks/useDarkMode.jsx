"use client";

import { useEffect } from "react";
import useMediaQuery from "./useMediaQuery";
import { useLocalStorage } from "./useStorage";

export default function useDarkMode() {
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
	const [darkMode, setDarkMode] = useLocalStorage("useDarkMode", prefersDarkMode);

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
