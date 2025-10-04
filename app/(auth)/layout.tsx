import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "../(root)/chat/[room_id]/loading";
import "@/app/lib/passwordRules.js";
import ProgressBar from "../ui/ProgressBar";
import Toaster from "../ui/Toast";

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
	title: "NextChat | auth",
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
	const theme = cookieStore.get("theme")?.value;

	return (
		<html lang="en" className={theme}>
			<body className={`${roboto.className}  antialiased flex flex-row h-screen w-screen`}>
				<ProgressBar></ProgressBar>
				<Suspense fallback={<Loading />}>{children}</Suspense>
				<Toaster />
			</body>
		</html>
	);
}
