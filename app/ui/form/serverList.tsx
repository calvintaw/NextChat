"use client";
import { joinServer } from "@/app/lib/actions";
import Link from "next/link";
import { Room, User } from "@/app/lib/definitions";
import { Avatar } from "../general/Avatar";
import clsx from "clsx";
import { formatNumber, getBannerColor } from "@/app/lib/utilities";
import { useState, useRef, useEffect } from "react";
import { IoSearch } from "react-icons/io5";
import { IconWithSVG } from "../general/Buttons";
import InputField from "./InputField";
import src from "react-textarea-autosize";
type FilterType = "all" | "public" | "private";
import { HiServerStack } from "react-icons/hi2";

export const ServerList = ({ user, servers }: { user: User; servers: Room[] }) => {
	const [search, setSearch] = useState("");
	const formRef = useRef<HTMLFormElement>(null);

	const [filterType, setFilterType] = useState<FilterType>("all");
	const filteredServers = servers.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

	return (
		<section className="p-4 flex flex-col gap-4 flex-1">
			<div className="flex flex-col md:flex-row justify-between items-center gap-4">
				<h1 className="text-2xl font-sans font-semibold">Featured Servers</h1>
				<form ref={formRef} className="md:w-fit relative flex gap-2" onSubmit={(e) => e.preventDefault()}>
					<InputField
						name="search"
						type="text"
						placeholder="Search servers..."
						icon={
							<IconWithSVG type="submit" className="icon-small">
								<IoSearch />
							</IconWithSVG>
						}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full"
						parentClassName="w-full flex-1 px-2"
					/>

					<select
						name="type"
						value={filterType}
						className="
							form-select
							!rounded-lg
							!border !border-border
							!bg-background
							!text-text
							!placeholder-muted
							!transition
							!text-base
							!focus:!border-primary
							!outline-none
							!w-fit md:!w-auto
						"
						onChange={(e) => setFilterType(e.target.value as FilterType)}
					>
						<option value="all">All Servers</option>
						<option value="public">Public</option>
						<option value="private">Private</option>
					</select>
				</form>
			</div>

			{filteredServers.length !== 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					{filteredServers.map((server) => {
						// TODO: add these to db schema
						server.online_members = 1000;

						return <Card key={server.id} server={server} user={user}></Card>;
					})}
				</div>
			)}
			{filteredServers.length === 0 && (
				<div className="flex-1 flex items-center justify-center">
					<div className="flex flex-col items-center justify-center">
						<HiServerStack className="text-6xl text-muted mb-4" />
						<p className="text-muted text-lg font-medium">No servers available.</p>
					</div>
				</div>
			)}
		</section>
	);
};

const Card = ({ server, user }: any) => {
	const [loaded, setLoaded] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	const handleImgLoad = () => {
		setLoaded(true);
	};

	useEffect(() => {
		if (imgRef.current) {
			if (imgRef.current.complete) {
				handleImgLoad();
			} else {
				imgRef.current.onload = handleImgLoad;
			}
		}
	}, [src]);
	return (
		<div
			className="bg-background p-0 rounded-xl overflow-hidden min-w-63 shadow-md flex flex-col border-2 border-border group hover:border-foreground/40 not-dark:hover:border-foreground/80 cursor-pointer 
							"
		>
			{/* Server Banner */}
			<div className="relative h-25 w-full mb-2.5">
				{server.banner ? (
					<>
						{!loaded && <div className="absolute bg-accent top-0 left-0 w-full h-full animate-pulse" />}
						<img
							src={server.banner}
							alt={`${server.name} banner`}
							className={clsx(!loaded ? "opacity-0" : "opacity-100")}
							loading="lazy"
							onLoad={() => setLoaded(true)}
							onError={() => setLoaded(false)}
						/>
					</>
				) : (
					<div className={clsx("absolute w-full h-full", getBannerColor(server.name))}></div>
				)}
				{/* Server Icon/Avatar */}
				<div className="absolute left-2.5 -bottom-6 z-[1] border-4 rounded-[18px] overflow-hidden border-surface">
					<Avatar
						statusIndicator={false}
						fontSize="text-xl"
						radius="rounded-lg"
						size="size-12"
						src={server.profile ?? ""}
						displayName={server.name}
					></Avatar>
				</div>
			</div>

			<div className="flex-1 p-4 pb-3 flex flex-col justify-between relative">
				<div>
					{/* Server Name and Verification */}
					<div className="flex items-center gap-1 -ml-1">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
							<path
								fill="var(--color-success)"
								fillRule="evenodd"
								d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Z"
								clipRule="evenodd"
							/>
							<g transform="translate(12 12) scale(1.5) translate(-12 -12)">
								<path
									fill="white"
									d="M15.61 10.186a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
								/>
							</g>
						</svg>

						<h2 title={server.name} className="text-lg font-bold line-clamp-1">
							{server.name || "No name"}
						</h2>
					</div>

					{/* Server Description */}
					<p className="text-muted text-sm mt-2 line-clamp-3">{server.description || "No description available."}</p>
				</div>

				{/* Server Stats and Join Button */}
				<div className="flex items-center justify-between text-muted text-xs mt-4">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1">
							<div className="size-2 bg-emerald-500 rounded-full" />
							<p>{formatNumber(server?.online_members)} Online</p>
						</div>
						<div className="flex items-center gap-1">
							<div className="size-2 bg-gray-400 rounded-full" />
							<p>{formatNumber(server?.total_members)} Members</p>
						</div>
					</div>

					<Link
						onClick={() => joinServer(server.id)}
						href={server.type === "dm" ? `/chat/${server.id}` : `/chat/server/${server.id}`}
					>
						<button
							disabled={server.owner_id === user.id}
							className="btn btn-third disabled:pointer-events-none  disabled:ring-2 ring-inset disabled:bg-green-600 disabled:text-white disabled:ring-green-600"
						>
							{server.owner_id === user.id ? "Joined" : "Join"}
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
};
