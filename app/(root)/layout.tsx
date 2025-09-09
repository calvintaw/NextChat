import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import Sidebar from "../ui/sidebar/Sidebar";
import { PathBanner } from "../ui/general/PathBanner";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "./chat/[room_id]/loading";


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
	const theme = cookieStore.get("theme")?.value;

	return (
		<html lang="en" className={theme}>
			<body className={`font-sans ${roboto.className} antialiased flex h-screen w-screen scroll-smooth`}>
				{/* Sidebar column */}
				<section className="flex flex-col h-full">
					<PathBanner />
					<Sidebar />
				</section>

				<Suspense fallback={<Loading />}>{children}</Suspense>
			</body>
		</html>
	);
}

