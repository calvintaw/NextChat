"use client";

export default function Page() {
	return (
		<main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center px-6 py-12">
			{/* Header / Hero */}
			<section className="text-center space-y-4">
				<h1 className="text-4xl md:text-6xl font-bold">John Doe</h1>
				<p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
					Frontend Developer | UI/UX Enthusiast | React & Next.js
				</p>
				<div className="flex justify-center gap-4 mt-4">
					<a
						href="#projects"
						className="px-6 py-2 border-2 border-gray-900 dark:border-gray-100 rounded-md hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black transition-colors"
					>
						Projects
					</a>
					<a
						href="#contact"
						className="px-6 py-2 border-2 border-gray-900 dark:border-gray-100 rounded-md hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black transition-colors"
					>
						Contact
					</a>
				</div>
			</section>

			{/* Projects */}
			<section id="projects" className="w-full max-w-4xl mt-16 space-y-8">
				<h2 className="text-3xl font-semibold text-center">Projects</h2>
				<div className="grid gap-6 sm:grid-cols-2">
					{[
						{ title: "NextChat Clone", desc: "Discord-inspired chat app" },
						{ title: "Portfolio Site", desc: "Minimalistic portfolio with Tailwind" },
						{ title: "Todo App", desc: "React + TypeScript todo manager" },
						{ title: "Weather App", desc: "Real-time weather forecast" },
					].map((proj) => (
						<div
							key={proj.title}
							className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow"
						>
							<h3 className="font-semibold text-xl mb-2">{proj.title}</h3>
							<p className="text-gray-600 dark:text-gray-300">{proj.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* Contact */}
			<section id="contact" className="w-full max-w-2xl mt-16 text-center space-y-4">
				<h2 className="text-3xl font-semibold">Contact</h2>
				<p className="text-gray-600 dark:text-gray-400">Feel free to reach out via email or social media.</p>
				<div className="flex justify-center gap-4">
					<a
						href="mailto:john@example.com"
						className="px-6 py-2 border-2 border-gray-900 dark:border-gray-100 rounded-md hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black transition-colors"
					>
						Email
					</a>
					<a
						href="https://github.com/johndoe"
						target="_blank"
						className="px-6 py-2 border-2 border-gray-900 dark:border-gray-100 rounded-md hover:bg-gray-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-black transition-colors"
					>
						GitHub
					</a>
				</div>
			</section>

			{/* Footer */}
			<footer className="mt-20 text-gray-500 dark:text-gray-400 text-sm">
				&copy; {new Date().getFullYear()} John Doe. All rights reserved.
			</footer>
		</main>
	);
}
