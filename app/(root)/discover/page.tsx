import { getAllServers } from "@/app/lib/actions";
import { User } from "@/app/lib/definitions";
import { ServerList } from "@/app/ui/form/serverList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const Page = async () => {
	const session = await auth();
	if (!session?.user) redirect("/login");
	const servers = await getAllServers();
	return (
		<section className="flex gap-2 flex-col flex-1 overflow-y-scroll bg-contrast has-scroll-container">
			<ServerList servers={servers} user={session.user as User}></ServerList>
		</section>
	);
};

export default Page;
