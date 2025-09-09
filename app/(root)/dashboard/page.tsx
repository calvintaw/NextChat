import DashboardPage from "@/app/ui/DashboardPage";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
import { BiSolidError } from "react-icons/bi";

export default async function Page() {
	const session = await auth();

	const errorState = (
		<div className="bg-background flex-1 flex flex-col justify-center items-center pt-16 px-4">
			<BiSolidError className="text-red-400 w-20 h-20 mb-4" />
			<p className="text-center mt-2 text-red-400 text-lg font-medium">Something went wrong. Please try again.</p>
		</div>
	);

	if (!session?.user) return errorState;

	console.log("Session in dashboard page:", session);

	return (
		<SessionProvider session={session}>
			<DashboardPage initialUser={session.user} />
		</SessionProvider>
	);
}
