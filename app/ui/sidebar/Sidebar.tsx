import { auth } from "@/auth";
import ChatPanel from "./components/ChatPanel";
import NavigationBar from "./components/NavigationBar";
import UserPanel from "./components/UserPanel";
import { getChats, getJoinedServers } from "@/app/lib/actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NavigationBarSkeleton } from "./components/NavigationBarSkeleton";

const Sidebar = async () => {
	const session = await auth();
	if (!session) redirect("/login");
	const user = session.user;
	const [joined_servers, chats] = await Promise.all([getJoinedServers(user.id), getChats(user.id)]);

	return (
		<nav
			id="sidebar"
			className="relative max-w-86  h-full flex flex-row items-start w-min border-contrast lg:border-r bg-background"
		>
			<Suspense fallback={<NavigationBarSkeleton />}>
				{/* <NavigationBarSkeleton /> */}
				<NavigationBar joined_servers={joined_servers} user={user}></NavigationBar>
			</Suspense>
			<ChatPanel chats={chats} user={user} />

			<UserPanel user={user}></UserPanel>
		</nav>
	);
};

export default Sidebar;
