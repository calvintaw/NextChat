"use client";

import { useEffect, useRef } from "react";
import { socket } from "@/app/lib/socket";
import { HiOutlineMicrophone } from "react-icons/hi";
import { MdCallEnd, MdScreenShare } from "react-icons/md";
import { PiCamera, PiCameraSlash } from "react-icons/pi";
import { TbMicrophoneOff } from "react-icons/tb";
import { FaPhone } from "react-icons/fa6";
import { Tooltip } from "react-tooltip";

type VideoCallSearchParams = {
	micOn: boolean;
	camOn: boolean;
};

export default function VideoCallPage({
	currentUser,
	searchParams,
	roomId = "",
}: {
	currentUser: User;
	roomId?: string;
	searchParams: VideoCallSearchParams;
}) {
	// ============================

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
	const [micOn, setMicOn] = useState(searchParams.micOn);
	const [camOn, setCamOn] = useState(searchParams.camOn);
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
	}, [roomId]);

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

		setMicOn(searchParams.micOn);
		setCamOn(searchParams.camOn);
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
		<div className="relative flex-1 h-[100vh] min-lg:h-[calc(100vh-32px)] pt-2 flex flex-col bg-background text-text select-none">
			<Tooltip
				id={`videochat-toolbar-icons-tooltip`}
				place="top"
				className="small-tooltip"
				border="var(--tooltip-border)"
				offset={5}
			/>

			<h3 className="ml-4 w-fit text-xs text-red-500">
				Warning: Video Call feature is still in developement. The UI do not work!
			</h3>

			{/* Remote Video */}
			<div className="flex-1 p-4 pt-2 max-[420px]:p-2">
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
			<div className="absolute bottom-24 right-6 w-40 h-28 rounded-lg overflow-hidden shadow-xl border border-border/40 bg-black/40 backdrop-blur">
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
					<StartVideoWithFriendDialog user={currentUser} startCall={startCall}></StartVideoWithFriendDialog>
				) : (
					<IconWithSVG onClick={leaveCall} className="icon bg-red-500 hover:bg-red-600 text-white transition">
						<MdCallEnd className="text-2xl" />
					</IconWithSVG>
				)}

				{/* MIC */}
				<IconWithSVG
					data-tooltip-id="videochat-toolbar-icons-tooltip"
					data-tooltip-content={micOn ? "Mute microphone" : "Unmute microphone"}
					onClick={toggleMic}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					{micOn ? <HiOutlineMicrophone className="text-2xl" /> : <TbMicrophoneOff className="text-2xl" />}
				</IconWithSVG>

				{/* CAMERA */}
				<IconWithSVG
					data-tooltip-id="videochat-toolbar-icons-tooltip"
					data-tooltip-content={camOn ? "Turn off camera" : "Turn on camera"}
					onClick={toggleCam}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					{camOn ? <PiCamera className="text-2xl" /> : <PiCameraSlash className="text-2xl" />}
				</IconWithSVG>

				{/* SCREEN SHARE */}
				<IconWithSVG
					data-tooltip-id="videochat-toolbar-icons-tooltip"
					data-tooltip-content="Start/stop screen share"
					onClick={shareScreen}
					className="hover:bg-foreground/25 bg-accent dark:bg-surface dark:hover:bg-accent"
					disabled={!inCall}
				>
					<MdScreenShare className="text-2xl" />
				</IconWithSVG>
			</div>
		</div>
	);
}

// Start CALL Dialog

import { getUserByUsername, createDM, getContacts } from "@/app/lib/actions";
import InputField from "@/app/ui/form/InputField";
import { Avatar } from "@/app/ui/general/Avatar";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import * as Dialog from "@radix-ui/react-dialog";
import { ContactType, User } from "@/app/lib/definitions";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FaPlus } from "react-icons/fa";
import { HiOutlineX } from "react-icons/hi";
import { IoSearch } from "react-icons/io5";
import { useFriendsProvider } from "@/app/lib/contexts/friendsContext";
import { UserCardSkeleton } from "../chat/components/ChatHeader/components/CreateDMDialog";

export const StartVideoWithFriendDialog = ({ user, startCall }: { user: User; startCall: () => void }) => {
	const { contacts } = useFriendsProvider();
	const [localContacts, setLocalContacts] = useState<ContactType[]>([]);
	const [loadingFallback, setLoadingFallback] = useState(false);
	const [username, setUsername] = useState("");
	const [query, setQuery] = useState("");

	function removeChatBot(contacts: ContactType[]) {
		return contacts.filter((contact) => contact.username !== "system");
	}

	useEffect(() => {
		if (contacts && contacts.length > 0) {
			setLocalContacts(removeChatBot(contacts));
		}
	}, [contacts]);

	useEffect(() => {
		if (!contacts || contacts.length === 0) {
			const fetchFallback = async () => {
				setLoadingFallback(true);
				const ownContacts = await getContacts(user.id);
				setLocalContacts(removeChatBot(ownContacts));
				setLoadingFallback(false);
			};

			fetchFallback();
		}
	}, []);

	const filteredContacts = localContacts.filter(
		(c) =>
			c.username.includes(query) ||
			c.displayName.includes(query) ||
			c.username.includes(username) ||
			c.displayName.includes(username)
	);

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button className="btn h-12 hover:bg-foreground/25 bg-green-600 text-white flex btn-with-icon gap-2 items-center">
					<FaPhone className="text-lg" />
					Start Call
				</button>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 pt-4 w-full max-w-md shadow-lg border border-border z-[12000]">
					<Dialog.Close asChild className="!absolute !top-2 !right-2">
						<IconWithSVG className="!rounded-md icon-small bg-accent/40 hover:bg-accent/60">
							<HiOutlineX />
						</IconWithSVG>
					</Dialog.Close>
					<Dialog.Title className="text-xl font-semibold text-text mb-4">Create a new DM</Dialog.Title>

					<div className="w-full md:ml-auto mb-4">
						<InputField
							name="q"
							type="text"
							placeholder="Enter username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							place="right"
							className="w-full flex-1"
							parentClassName="w-full min-h-0 h-10 px-1.5"
							icon={
								<IconWithSVG className="icon-small" onClick={() => setQuery(username)}>
									<IoSearch />
								</IconWithSVG>
							}
						/>
					</div>

					{loadingFallback && (
						<div className="max-h-[122px] overflow-y-auto flex flex-col justify-center gap-0.5 mt-2 p-2 pb-1 rounded-md bg-background dark:bg-background/45">
							<UserCardSkeleton />
							<UserCardSkeleton />
						</div>
					)}

					{!loadingFallback && filteredContacts.length > 0 && (
						<div className="max-h-[122px] overflow-y-auto flex flex-col justify-center gap-0.5 mt-2 p-2 pb-1 rounded-md bg-background dark:bg-background/45">
							{filteredContacts.map((user) => (
								<UserCard startCall={startCall} key={user.id} user={user} />
							))}
						</div>
					)}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

const UserCard = ({ user, startCall }: { user: User; startCall: () => void }) => {
	const [isPending, setIsPending] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string }>({ success: false, message: "" });

	async function waitForOtherUserAccept() {
		setIsPending(true);
		// const result = await createDM({ id: user.id, username: user.username });
		// setResult({ success: result.success, message: result.message });

		setIsPending(false);
		startCall();
	}

	return (
		<>
			<div className="rounded-md h-15 px-2.5  bg-accent/30 flex items-center gap-2.5">
				<div className="h-full flex items-center flex-row py-2.5">
					<Avatar
						disableTooltip={true}
						id={user.id}
						src={user.image}
						size="size-9"
						displayName={user.displayName}
						statusIndicator={false}
					/>
				</div>

				<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
					<p>{user.displayName}</p>
					<p>@{user.username}</p>
				</div>

				<button
					disabled={isPending}
					onClick={waitForOtherUserAccept}
					className="hover:bg-background/75 btn-with-icon justify-center items-center gap-2"
				>
					Send Invite
					{isPending && <BiLoaderAlt className="animate-spin text-lg" />}
				</button>
			</div>
			{result.success && <p className="mt-1 text-sm text-success">{result.message}</p>}
			{!result.success && <p className="mt-1 text-xs text-red-500">{result.message}</p>}
		</>
	);
};
