import * as Dialog from "@radix-ui/react-dialog";
import { HiOutlineX } from "react-icons/hi";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import { IoPause, IoPlay, IoSend, IoStop } from "react-icons/io5";
import { useChatProvider } from "../ChatBoxWrapper";
import { FaMicrophone } from "react-icons/fa";
import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer";
import { useEffect, useState } from "react";
import { LuRotateCcw } from "react-icons/lu";
import { supabase } from "@/app/lib/supabase";
import { nanoid } from "nanoid";

export const SendAudioMsgDialog = () => {
	const { handleSendMessageFromParent, roomId, user } = useChatProvider();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [isPending, setIsPending] = useState(false);

	const controls = useVoiceVisualizer();
	const {
		startRecording,
		stopRecording,
		togglePauseResume,
		startAudioPlayback,
		stopAudioPlayback,
		recordedBlob,
		error,
	} = controls;

	useEffect(() => {
		if (recordedBlob) console.log(recordedBlob);
	}, [recordedBlob]);

	const sendVoiceMsg = async () => {
		if (!recordedBlob) return;
		setIsPending(true);
		stopRecording();

		// upload + save
		const fileName = `voice_${nanoid()}.webm`;
		const file = new File([recordedBlob], fileName, { type: "audio/webm" });
		const { data, error } = await supabase.storage.from("voice_msgs").upload(`${roomId}/${fileName}`, file);

		if (error) return console.error(error);
		const publicUrl = supabase.storage.from("voice_msgs").getPublicUrl(data.path).data.publicUrl;

		await handleSendMessageFromParent(publicUrl, "audio");
		setDialogOpen(false);
		setIsPending(false);
		controls.clearCanvas();
	};

	useEffect(() => {
		if (error) console.error(error);
	}, [error]);
	return (
		<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
			<Dialog.Trigger asChild>
				<IconWithSVG className="bg-accent/60 hover:bg-secondary not-dark:bg-surface icon-small">
					<FaMicrophone className="text-xl"></FaMicrophone>
				</IconWithSVG>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 pt-5 w-full max-w-165 h-fit scale-95 shadow-lg border border-border
					z-[12000]
					flex flex-col items-center"
				>
					<Dialog.Close asChild className="!absolute !top-2 !right-2">
						<IconWithSVG
							className="!rounded-md bg-transparent hover:bg-accent/60"
							onClick={() => {
								if (controls.isRecordingInProgress) {
									stopRecording();
								}
								controls.clearCanvas();
							}}
						>
							<HiOutlineX />
						</IconWithSVG>
					</Dialog.Close>

					<Dialog.Title className="text-lg text-text text-left self-start w-full">Send a voice message</Dialog.Title>

					<div className="mt-6 w-full">
						<div>
							<VoiceVisualizer
								mainContainerClassName="!bg-black/25 not-dark:!bg-black/75 !rounded-lg"
								controls={controls}
								isControlPanelShown={false}
							/>

							<div className="flex gap-6 mt-4 justify-center border-red-500">
								{/* Idle */}
								{/* Idle */}
								{!controls.isRecordingInProgress && !recordedBlob && (
									<div className="flex flex-col gap-2 items-center text-center">
										<IconWithSVG
											className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
											onClick={startRecording}
										>
											<FaMicrophone />
										</IconWithSVG>
										<span className="text-base text-text">Record</span>
									</div>
								)}

								{/* Recording (not paused) */}
								{controls.isRecordingInProgress && !controls.isPausedRecording && (
									<>
										<div className="flex flex-col gap-2 items-center text-center">
											<IconWithSVG
												className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
												onClick={stopRecording}
											>
												<IoStop />
											</IconWithSVG>
											<span className="text-base text-text">Stop</span>
										</div>

										<div className="flex flex-col gap-2 items-center text-center">
											<IconWithSVG
												className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
												onClick={() => {
													stopRecording();
													controls.clearCanvas();
												}}
											>
												<HiOutlineX />
											</IconWithSVG>
											<span className="text-base text-text">Cancel</span>
										</div>
									</>
								)}

								{/* Paused recording */}
								{controls.isRecordingInProgress && controls.isPausedRecording && (
									<div className="flex flex-col gap-2 items-center text-center">
										<IconWithSVG
											className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
											onClick={togglePauseResume}
										>
											<IoPlay />
										</IconWithSVG>
										<span className="text-base text-text">Resume</span>
									</div>
								)}

								{/* Review Mode */}
								{recordedBlob && !controls.isRecordingInProgress && (
									<>
										{/* Play / Pause */}
										<div className="flex flex-col gap-2 items-center text-center">
											<IconWithSVG
												className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
												onClick={controls.isPausedRecordedAudio ? startAudioPlayback : togglePauseResume}
											>
												{controls.isPausedRecordedAudio ? <IoPlay /> : <IoPause />}
											</IconWithSVG>
											<span className="text-base text-text">{controls.isPausedRecordedAudio ? "Play" : "Pause"}</span>
										</div>

										{/* Redo */}
										<div className="flex flex-col gap-2 items-center text-center">
											<IconWithSVG
												className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
												onClick={() => {
													controls.clearCanvas();
												}}
											>
												<LuRotateCcw />
											</IconWithSVG>
											<span className="text-base text-text">Redo</span>
										</div>

										{/* Send */}
										<div className="flex flex-col gap-2 items-center text-center">
											<IconWithSVG
												className="bg-accent/40 hover:bg-accent/80 not-dark:hover:bg-black/25 not-dark:bg-black/7"
												onClick={sendVoiceMsg}
											>
												<IoSend />
											</IconWithSVG>
											<span className="text-base text-text">{isPending ? "Sending..." : "Send"}</span>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
