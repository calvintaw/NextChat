// "use client";

// import { useState } from "react";

// // React Icons
// import { HiOutlineMicrophone } from "react-icons/hi2";
// import { TbMicrophoneOff } from "react-icons/tb";
// import { PiCamera, PiCameraSlash } from "react-icons/pi";
// import { MdScreenShare } from "react-icons/md";
// import { AiOutlineUsergroupAdd } from "react-icons/ai";
// import { MdCallEnd } from "react-icons/md";

// export default function VideoCallUI() {
// 	const [muted, setMuted] = useState(false);
// 	const [cameraOff, setCameraOff] = useState(false);

// 	return (
// 		<div className="relative w-full h-full flex flex-col bg-background">
// 			{/* MAIN GRID */}
// 			<div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
// 				<VideoTile name="John Doe" />
// 				<VideoTile name="Sarah" />
// 				<VideoTile name="Andrew" />
// 				<VideoTile name="You" isLocal cameraOff={cameraOff} />
// 			</div>

// 			{/* CONTROLS BAR */}
// 			<div
// 				className="
//                 w-full py-3
//                 flex items-center justify-center gap-4
//                 border-t border-border/40
//                 bg-surface/60 backdrop-blur-md
//             "
// 			>
// 				{/* MIC */}
// 				<button
// 					className="icon bg-background/70 hover:bg-accent transition"
// 					onClick={() => setMuted((x) => !x)}
// 					data-tooltip-content={muted ? "Unmute" : "Mute"}
// 				>
// 					{muted ? <TbMicrophoneOff size={22} /> : <HiOutlineMicrophone size={22} />}
// 				</button>

// 				{/* CAMERA */}
// 				<button
// 					className="icon bg-background/70 hover:bg-accent transition"
// 					onClick={() => setCameraOff((x) => !x)}
// 					data-tooltip-content={cameraOff ? "Turn camera on" : "Turn camera off"}
// 				>
// 					{cameraOff ? <PiCameraSlash size={22} /> : <PiCamera size={22} />}
// 				</button>

// 				{/* SCREEN SHARE */}
// 				<button className="icon bg-background/70 hover:bg-accent transition" data-tooltip-content="Share Screen">
// 					<MdScreenShare size={22} />
// 				</button>

// 				{/* PARTICIPANTS */}
// 				<button className="icon bg-background/70 hover:bg-accent transition" data-tooltip-content="Participants">
// 					<AiOutlineUsergroupAdd size={22} />
// 				</button>

// 				{/* LEAVE CALL */}
// 				<button className="icon bg-red-600 hover:bg-red-700 text-white transition" data-tooltip-content="Leave Call">
// 					<MdCallEnd size={22} />
// 				</button>
// 			</div>
// 		</div>
// 	);
// }

// /* VIDEO TILE */
// function VideoTile({
// 	name,
// 	isLocal = false,
// 	cameraOff = false,
// }: {
// 	name: string,
// 	isLocal?: boolean,
// 	cameraOff?: boolean,
// }) {
// 	return (
// 		<div
// 			className="
//             relative rounded-xl overflow-hidden
//             bg-surface border border-border/30
//             flex items-center justify-center
//         "
// 		>
// 			{cameraOff ? (
// 				<div className="text-muted text-xl">Camera Off</div>
// 			) : (
// 				<div className="w-full h-full bg-black/40 flex items-center justify-center text-muted">
// 					{/* Placeholder: Replace with <video> tag */}
// 					<div className="text-sm opacity-70">Video Stream</div>
// 				</div>
// 			)}

// 			{/* NAME LABEL */}
// 			<div
// 				className="
//                 absolute bottom-2 left-2
//                 px-2 py-1 text-xs rounded-md
//                 bg-black/40 text-white backdrop-blur-sm
//             "
// 			>
// 				{isLocal ? `${name} (You)` : name}
// 			</div>
// 		</div>
// 	);
// }

"use client";

import React, { useState, useRef, useEffect } from "react";

// React Icons
import { HiOutlineMicrophone } from "react-icons/hi2";
import { TbMicrophoneOff } from "react-icons/tb";
import { PiCamera, PiCameraSlash } from "react-icons/pi";
import { MdScreenShare } from "react-icons/md";
import { MdCallEnd } from "react-icons/md";
import { IconWithSVG } from "../general/Buttons";

// 🔊 Speaking Indicator Animation
const SpeakingPulse = () => (
	<div className="absolute -bottom-1 left-1 h-2 w-2">
		<div className="absolute inset-0 rounded-full bg-green-500 opacity-70 animate-ping"></div>
		<div className="absolute inset-0 rounded-full bg-green-500"></div>
	</div>
);

// 📌 Component
export default function VideoCallPage() {
	const [muted, setMuted] = useState(false);
	const [cameraOff, setCameraOff] = useState(false);
	const [isScreenSharing, setIsScreenSharing] = useState(false);

	const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
	const audioLevelRef = useRef<HTMLAudioElement | null>(null);

	// 🔊 Fake Speaking Activity
	useEffect(() => {
		const interval = setInterval(() => {
			setIsLocalSpeaking(Math.random() > 0.7 && !muted);
		}, 700);

		return () => clearInterval(interval);
	}, [muted]);

	return (
		<div className="relative flex-1 min-lg:h-[calc(100vh-32px)] h-[100vh] flex flex-col bg-background text-text">
			{/* ============================= */}
			{/*           GRID AREA           */}
			{/* ============================= */}
			<div className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{/* Mock Remote Participants */}
				<VideoTile name="John Doe" speaking />
				<VideoTile name="Sarah" />
				<VideoTile name="Andrew" />

				{/* Local */}
				<VideoTile name="You" isLocal cameraOff={cameraOff} speaking={isLocalSpeaking} />
			</div>

			{/* ============================= */}
			{/*       FLOATING MINI PREVIEW   */}
			{/* ============================= */}
			<div className="absolute bottom-28 right-4 sm:right-6 w-40 h-28 bg-black/40 border border-border/40 rounded-lg overflow-hidden shadow-xl backdrop-blur">
				{cameraOff ? (
					<div className="w-full h-full text-muted flex items-center justify-center text-xs">Camera Off</div>
				) : (
					<div className="w-full h-full bg-black/40 flex items-center justify-center">
						<div className="text-xs opacity-70">Mini View</div>
					</div>
				)}

				<div className="absolute bottom-1 left-1 text-[10px] px-1 py-[1px] bg-black/50 rounded text-white">You</div>
			</div>

			{/* ============================= */}
			{/*         CONTROLS BAR          */}
			{/* ============================= */}
			<div
				className="
                w-full py-3 flex items-center justify-center gap-4 
                border-t border-contrast bg-contrast/75 backdrop-blur-md
            "
			>
				{/* MIC */}
				<IconWithSVG
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					onClick={() => setMuted((x) => !x)}
				>
					{muted ? <TbMicrophoneOff size={22} /> : <HiOutlineMicrophone size={22} />}
				</IconWithSVG>

				{/* CAMERA */}
				<IconWithSVG
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					onClick={() => setCameraOff((x) => !x)}
				>
					{cameraOff ? <PiCameraSlash size={22} /> : <PiCamera size={22} />}
				</IconWithSVG>

				{/* SCREEN SHARE */}
				<IconWithSVG
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					onClick={() => setIsScreenSharing((x) => !x)}
				>
					<MdScreenShare size={22} />
				</IconWithSVG>

				{/* LEAVE */}
				<IconWithSVG className="icon bg-red-500 hover:bg-red-600 text-white transition">
					<MdCallEnd size={22} />
				</IconWithSVG>
			</div>
		</div>
	);
}

/* ============================= */
/*      VIDEO TILE COMPONENT     */
/* ============================= */

function VideoTile({
	name,
	isLocal = false,
	cameraOff = false,
	speaking = false,
}: {
	name: string;
	isLocal?: boolean;
	cameraOff?: boolean;
	speaking?: boolean;
}) {
	return (
		<div
			className="
            relative rounded-xl overflow-hidden 
            bg-surface border border-border/30
            flex items-center justify-center
        "
		>
			{cameraOff ? (
				<div className="text-muted text-xl">Camera Off</div>
			) : (
				<div className="w-full h-full bg-black/40 flex items-center justify-center text-muted">
					<div className="text-sm opacity-70">Video Stream</div>
				</div>
			)}

			{/* NAME LABEL */}
			<div
				className="
                absolute bottom-2 left-2 
                px-2 py-1 text-xs rounded-md 
                bg-black/40 text-white backdrop-blur-sm flex items-center gap-1
            "
			>
				{isLocal ? `${name} (You)` : name}
			</div>

			{/* 🔊 Speaking Indicator */}
			{speaking && <SpeakingPulse />}
		</div>
	);
}
