import VideoCallPage from "@/app/ui/video_chat/VideoCallPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ room_id: string }>;
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const session = await auth();
	if (!session) redirect("/login");
	const currentUser = session.user;

	const { room_id } = await params;
	const filters = await searchParams;

	const allowedParams = {
		micOn: filters.micOn === "false" ? false : true, // default true
		camOn: filters.camOn === "false" ? false : true, // default true
	};

	return (
		<div className="w-full h-[100vh]">
			<VideoCallPage currentUser={currentUser} roomId={room_id} searchParams={allowedParams} />
		</div>
	);
}
