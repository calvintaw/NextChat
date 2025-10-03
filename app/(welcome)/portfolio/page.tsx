"use client";

export default function Page() {
	return (
		<main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-6 py-12 font-sans">
			{/* Hero */}
			<section className="text-center space-y-6 max-w-2xl">
				<h1 className="text-5xl md:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
					John Doe
				</h1>
				<p className="text-lg md:text-xl text-gray-400">
					Frontend Developer & UI/UX Designer — crafting modern web experiences with React & Next.js
				</p>
				<div className="flex justify-center  gap-4 mt-6">
					<a
						href="#projects"
						className="px-6 py-2 border border-indigo-400 text-indigo-400 rounded-md no-underline font-medium hover:bg-indigo-400 hover:text-gray-900 transition duration-300 ease-in-out"
					>
						Projects
					</a>
					<a
						href="#contact"
						className="px-6 py-2 border border-purple-400 text-purple-400 rounded-md no-underline font-medium hover:bg-purple-400 hover:text-gray-900 transition duration-300 ease-in-out"
					>
						Contact
					</a>
				</div>
			</section>

			{/* Projects */}
			<section id="projects" className="w-full max-w-6xl mt-20 space-y-12">
				<h2 className="text-4xl font-semibold text-center text-indigo-400">Projects</h2>
				<div className="flex flex-wrap justify-center gap-8">
					{[
						{ title: "NextChat Clone", desc: "Discord-inspired chat application with real-time features" },
						{ title: "Portfolio Site", desc: "Minimalistic, modern portfolio built with Tailwind CSS" },
						{ title: "Todo App", desc: "React + TypeScript todo manager with local storage persistence" },
						{ title: "Photo App", desc: "Pexels Clone" },
						{ title: "Weather App", desc: "Real-time weather forecast app with API integration" },
					].map((proj) => (
						<div
							key={proj.title}
							className="w-80 p-6 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
						>
							<h3 className="text-2xl font-semibold mb-2">{proj.title}</h3>
							<p className="text-gray-400">{proj.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<section id="contact" className="w-full max-w-2xl mt-20 text-center space-y-4">
				<h2 className="text-3xl font-semibold text-purple-400">Contact</h2>
				<p className="text-gray-400">Reach me via email or GitHub.</p>
				<div className="flex justify-center gap-4 mt-4">
					<a
						href="mailto:john@example.com"
						className="px-6 py-2 border border-indigo-400 text-indigo-400 rounded-md no-underline font-medium hover:bg-indigo-400 hover:text-gray-900 transition duration-300"
					>
						Email
					</a>
					<a
						href="https://github.com/johndoe"
						target="_blank"
						className="px-6 py-2 border border-purple-400 text-purple-400 rounded-md no-underline font-medium hover:bg-purple-400 hover:text-gray-900 transition duration-300"
					>
						GitHub
					</a>
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-24 text-gray-500 text-sm text-center">
				&copy; {new Date().getFullYear()} John Doe. All rights reserved.
			</footer>
		</main>
	);
}
