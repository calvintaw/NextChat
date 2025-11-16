import * as Dialog from "@radix-ui/react-dialog";
import { HiOutlineX } from "react-icons/hi";
import { PiVideoCameraFill } from "react-icons/pi";
import { nanoid } from "nanoid";
import { Avatar } from "@/app/ui/general/Avatar";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import { useRouter } from "next/navigation";
import { IoCall } from "react-icons/io5";
import { useChatProvider } from "../../../ChatBoxWrapper";
import { User } from "@/app/lib/definitions";
import { Route } from "next";

export const CallVideoChatDialog = ({ user }: { user: User }) => {
	const { handleSendMessageFromParent } = useChatProvider();
	// Define default allowedParams
	const router = useRouter();

	// Navigate to video call page with video+audio enabled
	const startVideoCall = () => {
		const roomId = nanoid();
		const params = new URLSearchParams({
			micOn: "true",
			camOn: "true",
		});

		const videoChatLink = `/video_chat/${roomId}?${params.toString()}`;
		const videoChatLink_msg_form = `[/video_chat/${roomId}, ${new Date()}]`;
		// router.push(videoChatLink as Route);
		navigator.clipboard.writeText(videoChatLink_msg_form);
		handleSendMessageFromParent(videoChatLink_msg_form, "video-call");
	};

	// Navigate to video call page with audio call
	const startCall = () => {
		const roomId = nanoid();
		const params = new URLSearchParams({
			micOn: "true",
			camOn: "false",
		});

		const videoChatLink = `/video_chat/${roomId}?${params.toString()}`;
		const videoChatLink_msg_form = `[/video_chat/${roomId}, ${new Date()}]`;
		// router.push(videoChatLink as Route);
		navigator.clipboard.writeText(videoChatLink_msg_form);
		handleSendMessageFromParent(videoChatLink_msg_form, "video-call");
	};

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<IconWithSVG className="!size-7.5">
					<IoCall className="text-lg" />
				</IconWithSVG>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-165 h-120 scale-95 shadow-lg border border-border
		z-[12000]
			flex flex-col items-center text-center
		"
				>
					<Dialog.Close asChild className="!absolute !top-2 !right-2">
						<IconWithSVG className="!rounded-md bg-transparent hover:bg-accent/60">
							<HiOutlineX />
						</IconWithSVG>
					</Dialog.Close>
					<Dialog.Title className="sr-only">DialogBox From calling {user.displayName}</Dialog.Title>
					<div className="mt-10 p-1 bg-linear-to-r from-pink-500 via-red-500 to-orange-500 rounded-full">
						<Avatar
							disableTooltip
							id={user.id}
							size={"size-30"}
							fontSize="text-3xl"
							displayName={user.displayName}
							src={user.image ?? ""}
							statusIndicator={false}
						></Avatar>
					</div>{" "}
					<p className="text-3xl mt-8">{user.displayName}</p>
					<p className="text-base font-normal text-muted mt-1">Click on the camera icon if you want to start a call.</p>
					<div className="flex justify-center gap-2 mt-auto">
						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<IconWithSVG onClick={startVideoCall} className="!rounded-full bg-success hover:bg-success/75">
								<PiVideoCameraFill />
							</IconWithSVG>
							<span className="text-sm text-muted">Start Video</span>
						</div>

						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<Dialog.Close asChild>
								<IconWithSVG className="!rounded-full bg-accent hover:bg-accent/60">
									<HiOutlineX />
								</IconWithSVG>
							</Dialog.Close>
							<span className="text-sm text-muted">Cancel</span>
						</div>

						<div className=" flex flex-col gap-2 items-center text-center min-w-19">
							<IconWithSVG onClick={startCall} className="!rounded-full bg-success hover:bg-success/75">
								<IoCall />
							</IconWithSVG>
							<span className="text-sm text-muted">Start Call</span>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
