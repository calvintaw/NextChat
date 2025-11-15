import { useState, useEffect } from "react";

export function useWindowSize() {
	const [size, setSize] = useState({ width: window.innerWidth });

	useEffect(() => {
		const handler = () => setSize({ width: window.innerWidth });
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
	}, []);

	return size;
}
