"use client";
import { useEffect, useRef, useState } from "react";

type Callback = () => void;

type Props = {
	state: string;
	startCallback?: Callback;
	endCallback?: Callback;
	delay: number;
};

const useDebounce = ({ state, startCallback = () => {}, endCallback = () => {}, delay }: Props) => {
	const [isActive, setIsActive] = useState(false);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const startCallbackRef = useRef(startCallback);
	const endCallbackRef = useRef(endCallback);
	const isFirstRender = useRef(true);

	useEffect(() => {
		startCallbackRef.current = startCallback;
		endCallbackRef.current = endCallback;
	}, [startCallback, endCallback]);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false
			return;
		};

		if (state === null || state === undefined) return;

		if (!isActive) {
			setIsActive(true);
			startCallbackRef.current();
		}

		timeoutRef.current = setTimeout(() => {
			endCallbackRef.current();
			setIsActive(false);
		}, delay);

		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, [state, delay]);

	const cancel = (delay?: number) => {
		if (delay) {
			setTimeout(() => {
						setIsActive(false);
						endCallbackRef.current();
						if (timeoutRef.current) clearTimeout(timeoutRef.current);
			}, delay)

			return 
		}

		setIsActive(false)
		endCallbackRef.current()
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
	}

	return { cancel, isActive };
};

export default useDebounce;
