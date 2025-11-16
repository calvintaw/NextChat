"use client";

import { joinServer } from "@/app/lib/actions";
import { useServersProvider } from "@/app/lib/contexts/ServersContext";
import { Room, User } from "@/app/lib/definitions";
import { getBannerColor, formatNumber } from "@/app/lib/utilities";
import clsx from "clsx";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { HiServerStack } from "react-icons/hi2";
import { IoSearch } from "react-icons/io5";

import { MdPeopleAlt } from "react-icons/md";
import src from "react-textarea-autosize";
import { Avatar } from "../general/Avatar";
import { IconWithSVG } from "../general/Buttons";
import InputField from "./InputField";

export const ServerList = ({ user, servers }: { user: User; servers: Room[] }) => {
	const [search, setSearch] = useState("");
	const formRef = useRef<HTMLFormElement>(null);

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

					{/* Commented out for future use (maybe) */}
					{/* 
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
					</select> */}
				</form>
			</div>

			<hr className="hr-separator my-2 border-contrast" />

			{filteredServers.length !== 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
					{filteredServers.map((server) => {
						return <Card key={server.id} server={server} user={user}></Card>;
					})}
				</div>
			)}
			{filteredServers.length === 0 && (
				<div className="flex-1 flex items-center justify-center">
					<div className="flex flex-col items-center justify-center text-center">
						<HiServerStack className="text-6xl text-muted mb-4" />
						<p className="text-lg font-medium text-muted mb-2">
							{search.trim() !== ""
								? `We couldn’t find any servers matching "${search.trim()}".`
								: "There aren’t any servers here yet."}
						</p>
						{search.trim() !== "" && (
							<p className="text-sm text-muted">Try checking your spelling or searching for something else.</p>
						)}
					</div>
				</div>
			)}
		</section>
	);
};

const Card = ({ server, user }: { server: Room; user: User }) => {
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

	const { joinedServers } = useServersProvider();
	const hasJoined = joinedServers.some((room) => room.id === server.id);

	return (
		<div
			className="bg-background p-0 rounded-xl overflow-hidden min-w-70 shadow-md flex flex-col border-2 border-border group hover:border-foreground/40 not-dark:hover:border-foreground/80  
							"
		>
			{/* Server Banner */}
			<div className="relative h-30 w-full mb-2.5">
				{server.banner ? (
					<>
						{!loaded && <div className="absolute bg-accent top-0 left-0 w-full h-full animate-pulse" />}
						<img
							src={server.banner}
							alt={`${server.name} banner`}
							className={clsx(!loaded ? "opacity-0" : "opacity-100", "w-full h-full object-cover")}
							loading="lazy"
							onLoad={() => setLoaded(true)}
							onError={() => setLoaded(false)}
						/>
					</>
				) : (
					<div className={clsx("absolute w-full h-full", getBannerColor(server.name))}></div>
				)}
				<div className="absolute left-2.5 -bottom-7 z-[1] flex items-center gap-2 right-0">
					{/* Server Icon/Avatar */}
					<div className=" border-4 rounded-[18px] overflow-hidden border-surface">
						<Avatar
							statusIndicator={false}
							fontSize="text-xl !no-underline"
							radius="rounded-lg"
							disableTooltip
							size="size-12"
							src={server.profile ?? ""}
							displayName={server.name}
						></Avatar>
					</div>

					{/* Server Name and Verification */}
					<div className="flex items-center gap-1 -ml-1 mt-7 flex-1">
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

						<h2 title={server.name} className="text-lg font-bold w-full max-w-[16ch] truncate">
							{server.name || "No name"}
						</h2>
					</div>
				</div>
			</div>

			<div className="flex-1 p-4 pb-3 flex flex-col justify-between relative">
				<div>
					{/* Server Description */}
					<p className="text-muted text-sm mt-2 max-w-[120ch]">{server.description || "No description available."}</p>
				</div>

				{/* Server Stats and Join Button */}
				<div className="flex items-center justify-between text-muted text-xs mt-4">
					<div className="flex items-center gap-4">
						<div className="flex items-center gap-1">
							{/* <div className="size-2 bg-gray-400 rounded-full" /> */}
							<MdPeopleAlt className="text-lg" />
							<p>
								{formatNumber(server?.total_members)}{" "}
								{server?.total_members && server.total_members > 1 ? "Members" : "Member"}
							</p>
						</div>
					</div>

					<Link
						onClick={() => server.type === "public" && joinServer(server.id)}
						className={clsx("no-underline", server.type === "private" && !hasJoined && "!cursor-not-allowed")}
						href={server.type === "dm" ? `/chat/${server.id}` : `/chat/server/${server.id}`}
					>
						<button
							disabled={hasJoined || server.type === "private"}
							className={clsx(
								"btn btn-third btn-with-icon flex items-center gap-1.5 disabled:pointer-events-none disabled:ring-2 ring-inset disabled:bg-foreground disabled:text-background disabled:ring-background"
							)}
							title={
								server.type === "private" && !hasJoined
									? "Private server – invite required"
									: hasJoined
									? "Enter server"
									: "Join server"
							}
						>
							{hasJoined ? (
								<>
									Enter <FaArrowRight />
								</>
							) : server.type === "public" ? (
								"Join"
							) : (
								"Invite Required"
							)}
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
};
