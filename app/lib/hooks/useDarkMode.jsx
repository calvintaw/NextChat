"use client";

import { useEffect } from "react";
import useMediaQuery from "./useMediaQuery";
import { useLocalStorage } from "./useStorage";
import { setThemeCookie } from "../actions";

export default function useDarkMode() {
	const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
	const [darkMode, setDarkMode] = useLocalStorage("useDarkMode", prefersDarkMode);

	const toggle = (value) => {
		setDarkMode((prev) => (typeof value === "boolean" ? value : !prev));
	};

	useEffect(() => {
		const update = async () => {
			if (typeof window === "undefined") return;
			document.documentElement.classList.toggle("dark", darkMode);
			await setThemeCookie(darkMode ? "dark" : "");
		};
		update();
	}, [darkMode]);

	return [darkMode, toggle];
}
