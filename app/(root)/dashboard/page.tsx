import { getReadmeByUsername } from "@/app/lib/actions";
import { User } from "@/app/lib/definitions";
import DashboardPage from "@/app/ui/DashboardPage";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

export default async function Page() {
	const session = await auth();
	if (!session?.user) throw new Error("Something went wrong. Please try again.");
	let user: User = { ...session.user };

	const userReadMe = await getReadmeByUsername(session.user.username);
	if (userReadMe.success && userReadMe.readme) {
		user.readme = userReadMe.readme;
	}

	return (
		<SessionProvider session={session}>
			<DashboardPage initialUser={user} />
		</SessionProvider>
	);
}
