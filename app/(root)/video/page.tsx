"use client";

import { useToast } from "@/app/lib/hooks/useToast";
import { socket } from "@/app/lib/socket";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Assume you have a toast function imported

export default function Page() {
	const [roomId, setRoomId] = useState("");
	const [joinRoomId, setJoinRoomId] = useState("");
	const [incomingCalls, setIncomingCalls] = useState<string[]>([]);
	const [isRoomCreator, setIsRoomCreator] = useState(false);
	const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
	const [callActive, setCallActive] = useState(false);

	const localVideoRef = useRef<HTMLVideoElement>(null);
	const remoteVideoRef = useRef<HTMLVideoElement>(null);
	const peerRef = useRef<RTCPeerConnection | null>(null);
	const toast = useToast();
	const socketRef = useRef<Socket>(socket);

	useEffect(() => {
		peerRef.current = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		peerRef.current.onicecandidate = (event) => {
			if (event.candidate && remoteSocketId) {
				socketRef.current?.emit("peer-updated", {
					candidate: event.candidate,
					to: remoteSocketId,
				});
			}
		};

		peerRef.current.ontrack = (event) => {
			if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		// Socket.io event listeners
		socketRef.current.on("join-request", (requesterUserId: string) => {
			setIncomingCalls((prev) => [...prev, requesterUserId]);
			toast({ title: "Incoming Call", mode: "info", subtitle: `User ${requesterUserId} wants to join.` });
		});

		socketRef.current.on("join-approved", () => {
			toast({ subtitle: "", title: "Join Approved", mode: "positive" });
		});

		socketRef.current.on("room-created", (id: string) => {
			setRoomId(id);
			toast({ title: "Room Created", mode: "positive", subtitle: `Room ID: ${id}` });
		});

		socketRef.current.on("room-exists", () => toast({ subtitle: "", title: "Room Already Exists", mode: "negative" }));

		socketRef.current.on("room-unavailable", () =>
			toast({ subtitle: "", title: "Room Not Available", mode: "negative" })
		);

		socketRef.current.on("start-peer-connection", initializePeerConnection);

		socketRef.current.on("offer-request", async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
			if (!peerRef.current) return;

			try {
				// 1️⃣ Get local media
				const myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
				if (localVideoRef.current) localVideoRef.current.srcObject = myStream;

				// 2️⃣ Add tracks before creating answer
				myStream.getTracks().forEach((track) => peerRef.current?.addTrack(track, myStream));

				// 3️⃣ Set remote description (incoming offer)
				await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));

				// 4️⃣ Create answer
				const answer = await peerRef.current.createAnswer();
				await peerRef.current.setLocalDescription(answer);

				// 5️⃣ Send answer back to caller
				socketRef.current?.emit("offer-answer", { answere: answer, to: data.from });

				setRemoteSocketId(data.from);
				toast({ title: "Offer Received", mode: "info", subtitle: `From: ${data.from}` });
			} catch (err) {
				toast({ title: "Error handling offer", mode: "negative", subtitle: String(err) });
				console.error(err);
			}
		});

		socketRef.current.on("offer-answer", async (data: { offer: RTCSessionDescriptionInit }) => {
			if (!peerRef.current) return;
			await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
			toast({ subtitle: "", title: "Answer Received", mode: "info" });
		});

		socketRef.current.on("peer-updated", async (data: { from: string; candidate: RTCIceCandidateInit }) => {
			if (!peerRef.current) return;
			await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
			toast({ subtitle: "", title: "ICE Candidate Added", mode: "info" });
		});

		return () => {
			socketRef.current?.disconnect();
		};
	}, [remoteSocketId]);

	const startVideoStream = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			if (localVideoRef.current) localVideoRef.current.srcObject = stream;
			stream.getTracks().forEach((track) => peerRef.current?.addTrack(track, stream));
		} catch (err) {
			toast({ title: "Error accessing webcam", mode: "negative", subtitle: String(err) });
		}
	};

	const createRoom = () => {
		if (!roomId) return toast({ subtitle: "", title: "Enter a room ID", mode: "negative" });
		setIsRoomCreator(true);
		socketRef.current?.emit("create-room", roomId);
	};

	const joinRoom = () => {
		if (!joinRoomId) return toast({ subtitle: "", title: "Enter a room ID", mode: "negative" });
		socketRef.current?.emit("join-video-room", joinRoomId);
	};

	const approveJoinRequest = (requesterUserId: string) => {
		socketRef.current?.emit("approve-join-request", roomId, requesterUserId);
		setIncomingCalls((prev) => prev.filter((id) => id !== requesterUserId));
		toast({ title: "Call Approved", mode: "positive", subtitle: `User ${requesterUserId} joined.` });
	};

	const rejectJoinRequest = (requesterUserId: string) => {
		setIncomingCalls((prev) => prev.filter((id) => id !== requesterUserId));
		toast({ title: "Call Rejected", mode: "negative", subtitle: `User ${requesterUserId} was rejected.` });
	};

	const initializePeerConnection = async (targetSocketId: string) => {
		setRemoteSocketId(targetSocketId);
		if (!peerRef.current) return;

		try {
			// 1️⃣ Get local media
			const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
			if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

			// 2️⃣ Add tracks before creating offer
			localStream.getTracks().forEach((track) => peerRef.current?.addTrack(track, localStream));

			// 3️⃣ Create offer
			const localOffer = await peerRef.current.createOffer();
			await peerRef.current.setLocalDescription(localOffer);

			// 4️⃣ Emit offer to remote peer
			socketRef.current?.emit("offer-request", { fromOffer: localOffer, to: targetSocketId });

			setCallActive(true);
			toast({ title: "Peer Connection Started", mode: "info", subtitle: `Connecting to ${targetSocketId}` });
		} catch (err) {
			toast({ title: "Error initializing call", mode: "negative", subtitle: String(err) });
			console.error(err);
		}
	};

	const closeCall = () => {
		if (!peerRef.current || !socketRef.current) return;

		// Stop tracks & close peer
		peerRef.current.getSenders().forEach((sender) => sender.track?.stop());
		peerRef.current.close();

		// Re-initialize peer connection with listeners
		peerRef.current = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

		peerRef.current.onicecandidate = (event) => {
			if (event.candidate && remoteSocketId) {
				socketRef.current?.emit("peer-updated", { candidate: event.candidate, to: remoteSocketId });
			}
		};

		peerRef.current.ontrack = (event) => {
			if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
				remoteVideoRef.current.srcObject = event.streams[0];
			}
		};

		// Clear remote video
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

		// Notify other peer
		if (remoteSocketId) socketRef.current.emit("call-ended", remoteSocketId);

		setCallActive(false);
		toast({ title: "Call Ended", mode: "info", subtitle: "" });
	};

	return (
		<>
			<h1 className="text-3xl font-bold underline">P2P Video Call</h1>
			<br />

			<div className="grid grid-cols-3 gap-4">
				<div className="mb-6" style={{ width: "300px" }}>
					<input
						type="text"
						value={roomId}
						onChange={(e) => setRoomId(e.target.value)}
						placeholder="Enter room id"
						className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                       focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                       dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					/>
					<br />
					<button
						onClick={createRoom}
						className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none 
                       focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto 
                       px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 
                       dark:focus:ring-blue-800"
					>
						Create new room
					</button>
				</div>

				<div className="mb-6">
					<input
						type="text"
						value={joinRoomId}
						onChange={(e) => setJoinRoomId(e.target.value)}
						placeholder="Enter room id"
						className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                       focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 
                       dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 
                       dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					/>
					<br />
					<button
						onClick={joinRoom}
						className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none 
                       focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto 
                       px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 
                       dark:focus:ring-blue-800"
					>
						Join existing room
					</button>
					<button className="btn-inverted" onClick={closeCall}>
						Close Call
					</button>
				</div>

				<div className="relative overflow-x-auto">
					{incomingCalls.length > 0 && (
						<table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
							<caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
								Incoming Calls
							</caption>
							<tbody>
								{incomingCalls.map((callerId) => (
									<tr key={callerId} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
										<th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
											{callerId}
										</th>
										<td className="px-4 py-4">
											<button
												onClick={() => approveJoinRequest(callerId)}
												className="text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
											>
												Accept
											</button>
										</td>
										<td className="px-4 py-4">
											<button
												onClick={() => rejectJoinRequest(callerId)}
												className="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
											>
												Reject
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{callActive && (
					<>
						<div>
							<video ref={localVideoRef} autoPlay muted className="w-full rounded-lg" />
						</div>
						<div>
							<video ref={remoteVideoRef} autoPlay className="w-full rounded-lg" />
						</div>
					</>
				)}
			</div>
		</>
	);
}
