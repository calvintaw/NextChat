"use client";

export default function Page() {
	return (
		<>
			{/* Navbar */}
			<Navbar></Navbar>

			<main className="flex-1 flex flex-col">
				{/* Hero Section */}
				<section className="relative flex flex-col items-center justify-center text-center py-20 sm:py-32 md:py-40 px-4 md:px-0 bg-gradient-to-br from-[#0A0F1C] via-[#10182F] to-[#0A0F1C]">
					<h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#00FFFF] mb-4 md:mb-6 leading-snug md:leading-tight">
						Where Friends Meet
					</h1>

					<p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl md:max-w-3xl mb-1">
						Connect with friends and communities in real-time
					</p>
					<p className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-100 max-w-2xl md:max-w-3xl mb-20">
						💬 Chat, share media, and stay updated effortlessly.
					</p>

					<div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
						<a
							href="#features"
							className="w-full no-underline decoration-0 sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-full border-2 border-[#39FF14] text-[#39FF14] text-xl font-semibold hover:bg-[#39FF14] hover:text-black transition-all"
						>
							Explore Features
						</a>
						<a
							href="https://next-chat-discord-clone.vercel.app/"
							target="_blank"
							rel="noopener noreferrer"
							className="w-full no-underline decoration-0 sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-full border-2 border-[#00FFFF] text-[#00FFFF] text-xl font-semibold hover:bg-[#00FFFF] hover:text-black transition-all"
						>
							Start Chatting Now
						</a>
					</div>
				</section>

				{/* Features Section */}
				<section id="features" className="py-24 px-6 md:px-20 bg-[#0F1525]">
					<h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">✨ Features You’ll Love</h2>
					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{[
							{
								title: "Instant Messaging",
								desc: "💬 Chat with friends and communities in real-time — never miss a message.",
							},
							{
								title: "Real-time Presence",
								desc: "👀 See who’s online or offline instantly and jump into conversations.",
							},
							{
								title: "Media Sharing",
								desc: "📸 Upload images, GIFs, and react to messages with fun emojis.",
							},
							{
								title: "Auth & Security",
								desc: "🔒 Safe and secure login, protecting your conversations.",
							},
							{
								title: "Dark Mode",
								desc: "🌙 Toggle between light and dark themes for comfort anytime.",
							},
							{
								title: "Dynamic Background",
								desc: "✨ Enjoy a visually engaging starry background while chatting.",
							},
						].map((feature) => (
							<div
								key={feature.title}
								className="p-8 rounded-2xl border border-[#1A2238] bg-[#12192E] hover:border-[#39FF14] hover:shadow-[0_0_10px_#39FF14] transition-all"
							>
								<h3 className="text-2xl font-semibold text-white mb-3">{feature.title}</h3>
								<p className="text-gray-400 text-base">{feature.desc}</p>
							</div>
						))}
					</div>
				</section>

				{/* Tech Stack Section */}
				<section
					id="tech-stack"
					className="py-24 px-6 md:px-20 bg-gradient-to-br from-[#0A0F1C] via-[#10182F] to-[#0A0F1C] text-center"
				>
					<h2 className="text-4xl md:text-5xl font-bold mb-16 text-white">🛠️ Tech Stack</h2>
					<div className="flex flex-wrap justify-center gap-6">
						{["Next.js", "React", "Tailwind CSS", "Supabase", "Postgres.js", "NextAuth.js"].map((tech) => (
							<div
								key={tech}
								className="px-8 py-4 border-2 border-[#39FF14] text-[#39FF14] text-lg rounded-xl font-semibold hover:bg-[#39FF14] hover:text-black transition-all"
							>
								{tech}
							</div>
						))}
					</div>
				</section>

				{/* Star Repo Section */}
				<section className="py-20 px-6 sm:px-20 text-center bg-[#0A0F1C] border-t border-[#1A1F2C]">
					<h2 className="text-3xl sm:text-5xl font-bold mb-6 text-white">⭐ Like this project?</h2>{" "}
					<p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-10">
						If you find this useful or inspiring, consider giving it a star on GitHub —{" "}
						{"(It doesn't matter but I just like to see the numbers go up)"}
					</p>
					<a
						href="https://github.com/calvintaw/discord_clone"
						target="_blank"
						rel="noopener noreferrer"
						className="no-underline decoration-0 px-8 py-4 rounded-full border-2 border-[#00FFFF] text-[#00FFFF] text-lg font-semibold hover:bg-[#00FFFF] hover:text-black transition-all"
					>
						Star on Github
					</a>
				</section>
			</main>

			{/* Footer */}
			<footer className="py-8 text-center text-gray-500 border-t border-[#1A1F2C] bg-[#0A0F1C]">
				Created by{" "}
				<a href="https://github.com/calvintaw" className="no-underline decoration-0 text-white hover:text-[#39FF14]">
					Calvin Taw
				</a>{" "}
				&copy; 2025
			</footer>
		</>
	);
}

import { IconWithSVG, MenuIcon } from "@/app/ui/general/Buttons";
import clsx from "clsx";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export function Navbar() {
	const [open, setOpen] = useState(false);

	return (
		<header className="w-full py-4 px-6 sm:px-12 flex justify-between items-center bg-[#0A0F1C] border-b border-[#1A1F2C] sticky top-0 z-50">
			{/* Logo */}
			<div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#39FF14] to-[#00FFFF]">
				NextChat
			</div>

			{/* Desktop Nav */}
			<nav className="hidden sm:flex items-center gap-6 text-lg font-medium">
				{["Features", "Tech Stack"].map((item) => (
					<a
						key={item}
						href={`#${item.toLowerCase().replace(" ", "-")}`}
						className="text-gray-200 hover:text-[#39FF14] transition-colors no-underline decoration-0"
					>
						{item}
					</a>
				))}
				<a
					href="https://github.com/calvintaw/discord_clone"
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-200 hover:text-[#00FFFF] transition-colors no-underline decoration-0"
				>
					GitHub
				</a>
			</nav>

			{/* Mobile Menu Button */}
			<div className="sm:hidden flex items-center gap-3">
				<div onClick={() => setOpen(!open)}>
					<MenuIcon />
				</div>
			</div>

			{/* Mobile Menu */}
			<div
				className={clsx(
					"absolute top-full left-0 w-full bg-[#0A0F1C] border-t border-[#1A1F2C] flex-col items-center py-6 gap-4 sm:hidden transition-all duration-300 overflow-hidden",
					open ? "flex max-h-[300px]" : "max-h-0 hidden"
				)}
			>
				{["Features", "Tech Stack"].map((item) => (
					<a
						key={item}
						href={`#${item.toLowerCase().replace(" ", "-")}`}
						className="text-gray-200 hover:text-[#39FF14] transition-colors no-underline decoration-0 py-2 text-lg"
						onClick={() => setOpen(false)}
					>
						{item}
					</a>
				))}
				<a
					href="https://github.com/calvintaw/discord_clone"
					target="_blank"
					rel="noopener noreferrer"
					className="text-gray-200 hover:text-[#00FFFF] transition-colors py-2 text-lg no-underline decoration-0"
					onClick={() => setOpen(false)}
				>
					GitHub
				</a>
			</div>
		</header>
	);
}
