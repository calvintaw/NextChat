"use client";
import { useEffect, useRef } from "react";
import { updateOnlineStatus } from "../lib/actions";
import { getSocket, socket } from "../lib/socket";

const OnlineIndicator = ({ name, userId }: { name: string,userId: string }) => {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const hasRun = useRef(false)

	useEffect(() => {
		if (!hasRun.current) {
			hasRun.current = true
			updateOnlineStatus(true, userId)
		}

		if (intervalRef.current) clearInterval(intervalRef.current)

		const socket = getSocket({
			auth: { name, id: userId }
		});
			
		socket.emit("online");
		intervalRef.current = setInterval(() => {
			socket.emit("online")
		}, 1000 * 15)

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			socket.disconnect();
			};
	}, [name, userId]);

	useEffect(() => {
		socket.emit("join", userId)
	}, [])

		
	return null;
};



export default OnlineIndicator;
