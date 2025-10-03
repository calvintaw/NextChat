import "@/app/globals.css";
import "@/app/stars.css";
import { ReactNode } from "react";

export const metadata = {
	title: "NextChat",
	description: "NextChat - Discord-inspired chat app built with Next.js, Tailwind CSS, and Supabase",
};

interface LandingLayoutProps {
	children?: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
	return (
		<html lang="en" className="scroll-smooth bg-background text-text dark">
			<body className="min-h-screen flex flex-col font-sans">
				<div className="bg-animation !z-[1000]">
					<div id="stars"></div>
					<div id="stars2"></div>
					<div id="stars3"></div>
					<div id="stars4"></div>
				</div>
				{children}
			</body>
		</html>
	);
}
