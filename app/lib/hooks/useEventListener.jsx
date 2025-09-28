"use client";

import { useEffect, useRef } from "react";

export default function useEventListener(eventType, callback, element = typeof window !== "undefined" ? window : null) {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		if (element == null || !element || typeof element === "undefined") return;
		const handler = (e) => callbackRef.current(e);
		element.addEventListener(eventType, handler);

		return () => element.removeEventListener(eventType, handler);
	}, [eventType, element]);
}
