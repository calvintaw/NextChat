import VideoCallPage from "@/app/ui/video_chat/VideoCallPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Page() {
	const session = await auth();
	if (!session) redirect("/login");
	const currentUser = session.user;

	const defaultParams = {
		micOn:  true, 
		camOn:  true, 
	};

	return (
		<div className="w-full h-[100vh]">
			<VideoCallPage currentUser={currentUser} searchParams={defaultParams} />
		</div>
	);
}
