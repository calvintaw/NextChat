import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "../(root)/chat/[room_id]/loading";

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
			<body className={`${roboto.className}  antialiased flex flex-row h-screen w-screen`}>
				<Suspense fallback={<Loading />}>{children}</Suspense>
			</body>
		</html>
	);
}
