import VideoCallPage from "@/app/ui/video_chat/VideoCallPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ room_id: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");
	const currentUser = session.user;

	const { room_id } = await params;

	return (
		<div className="w-full h-[100vh]">
			<VideoCallPage roomId={room_id} />
		</div>
	);
}
