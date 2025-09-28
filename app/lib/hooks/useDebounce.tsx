"use client";
import { useState, useRef } from "react";

export default function useDebounce({
	startCallback = () => {},
	endCallback = () => {},
	delay,
}: {
	startCallback?: () => void;
	endCallback?: () => void;
	delay: number;
}) {
	const [isActive, setIsActive] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const trigger = () => {
		if (!isActive) {
			setIsActive(true);
			startCallback();
		}

		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		timeoutRef.current = setTimeout(() => {
			endCallback();
			setIsActive(false);
		}, delay);
	};

	const cancel = (delayOverride?: number) => {
		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		if (delayOverride) {
			timeoutRef.current = setTimeout(() => {
				endCallback();
				setIsActive(false);
			}, delayOverride);
			return;
		}

		endCallback();
		setIsActive(false);
	};

	return { trigger, cancel, isActive };
}
