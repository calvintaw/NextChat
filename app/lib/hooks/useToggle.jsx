"use client";
import { useState, useCallback } from "react";

export default function useToggle(initialState) {
	const [state, setState] = useState(initialState);

	const toggle = useCallback((value) => {
		setState((prev) => (typeof value === "boolean" ? value : !prev));
	}, []);

	return [state, toggle];
}
