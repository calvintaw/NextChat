import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import Sidebar from "../ui/sidebar/Sidebar";
import { PathBanner } from "../ui/general/PathBanner";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "./chat/[room_id]/loading";
import FriendsProvider from "../lib/friendsContext";
import "@/app/lib/passwordRules.js";
import Toaster from "../ui/Toast";
import PathProvider from "../lib/PathContext";
import ProgressBar from "@/app/ui/ProgressBar";

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
	title: "Discord Clone",
	description: "Created By AB",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const theme = cookieStore.get("theme")?.value || "dark";
	console.log("cookie STORE: ", theme);

	return (
		<html lang="en" className={theme}>
			<body className={`font-sans ${roboto.className} antialiased flex flex-col h-screen w-screen scroll-smooth`}>
				<ProgressBar></ProgressBar>
				<PathProvider>
					<PathBanner />
					<main className="flex w-full h-full">
						<FriendsProvider>
							<Sidebar />
							<div className="flex flex-1 w-full h-full border-t border-contrast">
								<Suspense fallback={<Loading className="!w-full !h-full" />}>{children}</Suspense>
							</div>
						</FriendsProvider>
					</main>
					<Toaster />
				</PathProvider>
			</body>
		</html>
	);
}
