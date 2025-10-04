import { GiStarShuriken } from "react-icons/gi";

export default function Page() {
	const projects = [
		{
			title: "NextChat",
			desc: "NextChat - A real time chat app with discord like UI and functionalities. ",
			link: "https://github.com/calvintaw/discord_clone",
		},
		{
			title: "Lenscape",
			desc: "Lenscape – React app for discovering, searching, and previewing photos and videos via the Pexels API. ",
			link: "https://photo-mcb6t8z01-ambitiouscalvins-projects.vercel.app/",
		},
		{
			title: "Portfolio Site",
			desc: "Minimalistic, modern portfolio built with Tailwind CSS",
			link: "#",
		},
	];

	return (
		<main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-6 py-12 font-sans">
			{/* Hero */}
			<section className="text-center space-y-6 max-w-2xl">
				<h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
					Calvin Taw
				</h1>
				<p className="text-lg md:text-xl text-gray-400">
					Frontend Developer & Student
					<br></br>
					building modern web apps with React, and Next.js
				</p>
			</section>

			{/* Projects */}
			<section id="projects" className="w-full max-w-6xl mt-20">
				<h2 className="text-4xl font-semibold text-center text-indigo-400 mb-10">🚀 Featured Projects</h2>
				<div className="flex flex-wrap justify-center gap-8">
					{projects.map((proj) => (
						<a
							key={proj.title}
							href={proj.link}
							target="_blank"
							className="w-100 p-6 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition-all no-underline"
						>
							<h3
								className="text-2xl font-semibold mb-2 flex items-center gap-1.5 
							bg-clip-text text-transparent 
bg-linear-to-r from-green-500 via-emerald-500 to-teal-500
							"
							>
								<GiStarShuriken className="text-indigo-400" />
								{proj.title}
							</h3>
							<p className="text-gray-400">{proj.desc}</p>
						</a>
					))}
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-12 text-gray-500 text-sm text-center">
				&copy; {new Date().getFullYear()} Calvin Taw. All rights reserved.
			</footer>
		</main>
	);
}
