import { io, Socket, ManagerOptions, SocketOptions } from "socket.io-client";

const URL: string = process.env.NEXT_PUBLIC_SOCKET_URL!;

export const socket: Socket = io(URL, {
	withCredentials: true,
	closeOnBeforeunload: true,
});

export const getSocket = (config?: Partial<ManagerOptions & SocketOptions>): Socket => {
	return io(URL, {
		withCredentials: true,
		closeOnBeforeunload: true,
		...config,
	});
};
