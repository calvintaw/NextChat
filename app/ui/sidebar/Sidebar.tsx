import { auth } from "@/auth";
import OnlineIndicator from "../OnlineIndicator";
import ChatPanel from "./components/ChatPanel";
import NavigationBar from "./components/NavigationBar";
import UserPanel from "./components/UserPanel";
import { getJoinedServers } from "@/app/lib/actions";
import { Tooltip } from "react-tooltip";
import { redirect } from "next/navigation";


const Sidebar = async ({ className }: { className?: string }) => {
	const session = await auth();
	if (!session) redirect("/login");
	const user = session.user;
	const joined_servers = await getJoinedServers(user.id);

	return (
		<>
			<nav
				id="sidebar"
				className={`relative flex-1 max-w-[345px] h-full flex flex-row items-start w-fit ${className} border-contrast border-r-2`}			
			>
				<OnlineIndicator name={user.displayName} userId={user.id}></OnlineIndicator>

				<NavigationBar joined_servers={joined_servers} user={user}></NavigationBar>
				<ChatPanel user={user} />

				<UserPanel user={user}></UserPanel>
			</nav>

		</>
	);
};

export default Sidebar;
