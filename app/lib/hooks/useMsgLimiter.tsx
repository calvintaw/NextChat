import { useRef } from "react";
import { useToast } from "./useToast";

export const useMessageLimiter = (maxMessages: number, windowMs: number) => {
	const toast = useToast();
	const timestampsRef = useRef<number[]>([]); // track send times

	const canSendMessage = (): boolean => {
		const now = Date.now();

		// Remove timestamps older than the window
		timestampsRef.current = timestampsRef.current.filter((ts) => now - ts < windowMs);

		if (timestampsRef.current.length >= maxMessages) {
			toast({
				title: "Warning!",
				mode: "negative",
				subtitle: `You're only allowed to send ${maxMessages} messages per minute.`,
			});
			return false; // limit reached
		}

		timestampsRef.current.push(now); // record this send
		return true;
	};

	return { canSendMessage };
};
