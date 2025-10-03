"use client";
import { useEffect, useRef } from "react";
import { updateOnlineStatus } from "../lib/actions";
import { getSocket } from "../lib/socket";

// refs exist here to prevent emitting socket events if the component remounts
// BUT if user does full page reload, the events will fire as the js context is reset
// TODO: fix the above err

const OnlineIndicator = ({ name, userId }: { name: string; userId: string }) => {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const hasRun = useRef(false);
	const Once = useRef(false);
	const socketRef = useRef(getSocket({ auth: { name, id: userId } }));

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true;
			updateOnlineStatus(true, userId);
		}

		if (intervalRef.current) clearInterval(intervalRef.current);

		socketRef.current.emit("online");
		intervalRef.current = setInterval(() => {
			socketRef.current.emit("online");
		}, 1000 * 15);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			socketRef.current.disconnect();
		};
	}, [name, userId]);

	useEffect(() => {
		if (!Once.current) {
			socketRef.current.emit("join", userId);
			Once.current = true;
		}
	}, []);

	return null;
};

export default OnlineIndicator;
