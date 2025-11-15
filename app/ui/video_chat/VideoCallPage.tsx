"use client";

import React, { useEffect, useRef, useState } from "react";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { TbMicrophoneOff } from "react-icons/tb";
import { PiCamera, PiCameraSlash } from "react-icons/pi";
import { MdScreenShare, MdCallEnd } from "react-icons/md";
import { IconWithSVG } from "../general/Buttons";
import { socket } from "@/app/lib/socket";

export default function VideoCallPage({ roomId }: { roomId: string }) {
	// =============================
	//   VIDEO + RTC STATE
	// =============================
	// Video element refs
	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

	// Peer connection ref
	const pcRef = useRef<RTCPeerConnection | null>(null);

	// Media streams
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

	// Control states
	const [micOn, setMicOn] = useState(true);
	const [camOn, setCamOn] = useState(true);
	const [inCall, setInCall] = useState(false);

	useEffect(() => {
		socket.emit("join-video", roomId);
		console.log("Joined room:", roomId);

		socket.on("offer-video", async (offer) => {
			console.log("Received offer:", offer);
			if (!pcRef.current) return;

			await pcRef.current.setRemoteDescription(offer);
			const answer = await pcRef.current.createAnswer();
			await pcRef.current.setLocalDescription(answer);

			socket.emit("answer-video", { roomId, answer });
			console.log("Sent answer:", answer);
		});

		socket.on("answer-video", async (answer) => {
			console.log("Received answer:", answer);
			if (!pcRef.current) return;
			await pcRef.current.setRemoteDescription(answer);
		});

		socket.on("ice-candidate", async (candidate) => {
			console.log("Received ICE candidate:", candidate);
			try {
				await pcRef.current?.addIceCandidate(candidate);
				console.log("ICE candidate added");
			} catch (err) {
				console.error("Error adding ICE candidate:", err);
			}
		});

		return () => {
			socket.off("offer-video");
			socket.off("answer-video");
			socket.off("ice-candidate");
		};
	}, []);

	// =============================
	//   INIT LOCAL MEDIA
	// =============================
	const startLocalStream = async () => {
		console.log("Starting local media...");
		const stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});
		setLocalStream(stream);
		if (localVideoRef.current) localVideoRef.current.srcObject = stream;
		console.log("Local media stream started:", stream);

		return stream;
	};

	// =============================
	//   CREATE PEER CONNECTION
	// =============================
	const createPeerConnection = () => {
		console.log("Creating peer connection...");
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		// Remote stream
		const incoming = new MediaStream();
		setRemoteStream(incoming);
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = incoming;

		pc.ontrack = (e) => {
			console.log("Remote track received:", e.streams[0]);
			e.streams[0].getTracks().forEach((t) => incoming.addTrack(t));
		};

		pc.onicecandidate = (e) => {
			if (e.candidate) {
				socket.emit("ice-candidate", { roomId, candidate: e.candidate });
				console.log("Sent ICE candidate:", e.candidate);
			}
		};

		pc.onconnectionstatechange = () => {
			console.log("Connection state changed:", pc.connectionState);
		};

		pc.oniceconnectionstatechange = () => {
			console.log("ICE connection state:", pc.iceConnectionState);
		};

		return pc;
	};

	// =============================
	//   START CALL
	// =============================
	const startCall = async () => {
		console.log("Starting call...");
		const stream = await startLocalStream();
		if (!stream) {
			console.error("stream NULL in startCALL");
			return;
		}
		// return the stream from startLocalStream

		const pc = createPeerConnection();
		pcRef.current = pc;

		stream.getTracks().forEach((t) => pc.addTrack(t, stream));

		// Offer
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		socket.emit("offer-video", { roomId, offer });
		console.log("Offer sent:", offer);

		setInCall(true);
	};

	const toggleMic = () => {
		if (!localStream) return;
		localStream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
		setMicOn(!micOn);
		console.log("Mic toggled. Now:", !micOn);
	};

	const toggleCam = () => {
		if (!localStream) return;
		localStream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
		setCamOn(!camOn);
		console.log("Cam toggled. Now:", !camOn);
	};

	const leaveCall = () => {
		console.log("Leaving call...");
		pcRef.current?.close();
		pcRef.current = null;

		localStream?.getTracks().forEach((t) => t.stop());
		setLocalStream(null);
		setRemoteStream(null);
		setInCall(false);
		setMicOn(true);
		setCamOn(true);
		setInCall(false);
		if (localVideoRef.current) localVideoRef.current.srcObject = null;
		if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

		console.log("Call left");
	};

	// =============================
	//   SCREEN SHARE
	// =============================
	const shareScreen = async () => {
		if (!pcRef.current || !localStream) {
			console.error("shareScreen ERROR. Possibly pcRef.current or localStream Null");
			return;
		}

		console.log("Starting screen share...");
		const screen = await navigator.mediaDevices.getDisplayMedia({
			video: true,
		});

		const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video");

		if (!sender) return;

		sender.replaceTrack(screen.getVideoTracks()[0]);
		console.log("Screen track replaced sender");

		screen.getVideoTracks()[0].onended = () => {
			const localVideoTrack = localStream.getVideoTracks()[0];
			if (localVideoTrack) sender.replaceTrack(localVideoTrack);
			console.log("Screen share ended, restored local video track");
		};
	};

	// ============================================================
	//                     RENDER (UI NOT CHANGED)
	// ============================================================
	return (
		<div className="relative flex-1 h-[100vh] min-lg:h-[calc(100vh-32px)] flex flex-col bg-background text-text select-none">
			{/* Remote Video */}
			<div className="flex-1 p-4">
				<div className="w-full h-full rounded-xl bg-foreground/30 dark:bg-foreground/20 border border-contrast flex items-center justify-center overflow-hidden relative">
					<div className="text-text opacity-50 text-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						Remote Video
					</div>
					<video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
					<div className="absolute bottom-3 left-3 px-2 py-1 text-xs rounded-md bg-black/40 text-white backdrop-blur-sm">
						John Doe
					</div>
				</div>
			</div>

			{/* Local Mini Preview */}
			<div className="absolute bottom-28 right-4 sm:right-6 w-40 h-28 rounded-lg overflow-hidden shadow-xl border border-border/40 bg-black/40 backdrop-blur">
				<video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />{" "}
				<div
					className="text-[11px] opacity-50 text-white
					 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
				"
				>
					Your Camera
				</div>
				<div className="absolute bottom-1 left-1 text-[10px] px-1 py-[1px] bg-black/60 rounded text-white">You</div>
			</div>

			{/* Controls */}
			<div className="w-full py-3 flex items-center justify-center gap-4 border-t border-contrast bg-contrast/75 backdrop-blur-md">
				{/* START / LEAVE CALL */}
				{!inCall ? (
					<IconWithSVG onClick={startCall} className="hover:bg-foreground/25 bg-green-500 text-white">
						Start Call
					</IconWithSVG>
				) : (
					<IconWithSVG onClick={leaveCall} className="icon bg-red-500 hover:bg-red-600 text-white transition">
						<MdCallEnd size={22} />
					</IconWithSVG>
				)}

				{/* MIC */}
				<IconWithSVG
					onClick={toggleMic}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					{micOn ? <HiOutlineMicrophone size={22} /> : <TbMicrophoneOff size={22} />}
				</IconWithSVG>

				{/* CAMERA */}
				<IconWithSVG
					onClick={toggleCam}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					{camOn ? <PiCamera size={22} /> : <PiCameraSlash size={22} />}
				</IconWithSVG>

				{/* SCREEN SHARE */}
				<IconWithSVG
					onClick={shareScreen}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					<MdScreenShare size={22} />
				</IconWithSVG>
			</div>
		</div>
	);
}

// "use client";

// import React from "react";
// import { HiOutlineMicrophone } from "react-icons/hi2";
// import { TbMicrophoneOff } from "react-icons/tb";
// import { PiCamera, PiCameraSlash } from "react-icons/pi";
// import { MdScreenShare, MdCallEnd } from "react-icons/md";
// import { IconWithSVG } from "../general/Buttons";

// // 🔊 Speaking Indicator
// const SpeakingPulse = () => (
// 	<div className="absolute -bottom-1 left-1 h-2 w-2">
// 		<div className="absolute inset-0 rounded-full bg-green-500 opacity-70 animate-ping"></div>
// 		<div className="absolute inset-0 rounded-full bg-green-500"></div>
// 	</div>
// );

// export default function VideoCallPage() {
// 	return (
// 		<div className="relative flex-1 h-[100vh] min-lg:h-[calc(100vh-32px)] flex flex-col bg-background text-text select-none">
// 			{/* ============================= */}
// 			{/*         REMOTE VIDEO          */}
// 			{/* ============================= */}
// 			<div className="flex-1 p-4">
// 				<div className="w-full h-full rounded-xl bg-foreground/30 border border-contrast flex items-center justify-center overflow-hidden relative">
// 					<div className="text-text opacity-70 text-sm">Remote Video</div>

// 					{/* Name */}
// 					<div className="absolute bottom-3 left-3 px-2 py-1 text-xs rounded-md bg-black/40 text-white backdrop-blur-sm">
// 						John Doe
// 					</div>
// 				</div>
// 			</div>

// 			{/* ============================= */}
// 			{/*       LOCAL MINI PREVIEW      */}
// 			{/* ============================= */}
// 			<div className="absolute bottom-28 right-4 sm:right-6 w-40 h-28 rounded-lg overflow-hidden shadow-xl border border-border/40 bg-black/40 backdrop-blur">
// 				<div className="w-full h-full flex items-center justify-center text-muted">
// 					<div className="text-[11px] opacity-70 text-white">Your Camera</div>
// 				</div>

// 				<div className="absolute bottom-1 left-1 text-[10px] px-1 py-[1px] bg-black/60 rounded text-white">You</div>
// 			</div>

// 			{/* ============================= */}
// 			{/*         CONTROLS BAR          */}
// 			{/* ============================= */}
// 			<div className="w-full py-3 flex items-center justify-center gap-4 border-t border-contrast bg-contrast/75 backdrop-blur-md">
// 				{/* MIC */}
// 				<IconWithSVG className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent">
// 					<HiOutlineMicrophone size={22} />
// 				</IconWithSVG>

// 				{/* CAMERA */}
// 				<IconWithSVG className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent">
// 					<PiCamera size={22} />
// 				</IconWithSVG>

// 				{/* SCREEN SHARE */}
// 				<IconWithSVG className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent">
// 					<MdScreenShare size={22} />
// 				</IconWithSVG>

// 				{/* LEAVE */}
// 				<IconWithSVG className="icon bg-red-500 hover:bg-red-600 text-white transition">
// 					<MdCallEnd size={22} />
// 				</IconWithSVG>
// 			</div>
// 		</div>
// 	);
// }
