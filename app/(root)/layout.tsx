import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import "@/app/stars.css";
import Sidebar from "../ui/sidebar/Sidebar";
import { PathBanner } from "../ui/general/PathBanner";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "./chat/[room_id]/loading";
import FriendsProvider from "../lib/contexts/friendsContext";
import "@/app/lib/passwordRules.js";
import Toaster from "../ui/Toast";
import PathProvider from "../lib/contexts/PathContext";
import ProgressBar from "@/app/ui/ProgressBar";
import SupabasePresenceWrapper from "../ui/SupabasePresenceWrapper";
import GeneralProvider from "../lib/contexts/GeneralContextProvider";

const roboto = localFont({
	src: [
		{
			path: "../../public/fonts/Roboto-Regular.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/fonts/Roboto-Bold.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-roboto",
	display: "swap",
});

export const metadata: Metadata = {
	title: "NextChat | Home",
	description:
		"NextChat - A Discord-inspired chat app with real-time messaging, servers, reactions, image uploads, and profile customization. | Created By calvintaw",
	icons: {
		icon: "/logo.ico",
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const theme = cookieStore.get("theme")?.value?.trim() || "dark";
	const starsBackgroundEnabled = cookieStore.get("starsBackgroundEnabled")?.value || "disable-stars-bg";

	return (
		<html lang="en" className={`${theme} h-full min-h-screen ${starsBackgroundEnabled}`}>
			<body
				className={`font-sans ${roboto.className} antialiased flex flex-col h-full min-h-screen w-full min-w-0 scroll-smooth`}
			>
				<div className="bg-animation !z-[1000]">
					<div id="stars"></div>
					<div id="stars2"></div>
					<div id="stars3"></div>
					<div id="stars4"></div>
				</div>
				<ProgressBar></ProgressBar>
				<PathProvider>
					<PathBanner />
					<main className="flex flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden">
						<GeneralProvider>
							<FriendsProvider>
								<SupabasePresenceWrapper />
								<Sidebar />
								<div className="flex flex-1 min-h-0 min-w-0 w-full h-full border-t border-contrast overflow-hidden">
									<Suspense fallback={<Loading className="!w-full !h-full" />}>{children}</Suspense>
								</div>
							</FriendsProvider>
						</GeneralProvider>
					</main>
					<Toaster />
				</PathProvider>
			</body>
		</html>
	);
}
