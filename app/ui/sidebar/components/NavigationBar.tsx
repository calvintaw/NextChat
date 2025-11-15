"use client";
import React, { useEffect } from "react";
import { MdSpaceDashboard } from "react-icons/md";
import { RiCompassDiscoverFill } from "react-icons/ri";
import Link from "next/link";
import { IconWithSVG } from "../../general/Buttons";
import { Tooltip } from "react-tooltip";
import { BsChatDotsFill } from "react-icons/bs";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import CreateServerFormDialog from "@/app/ui/form/CreateServerForm";
import { Room, User } from "@/app/lib/definitions";
import { Avatar } from "../../general/Avatar";
import { IconType } from "react-icons";
import { Route } from "next";
import useEventListener from "@/app/lib/hooks/useEventListener";
import { FaStar } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { useServersProvider } from "@/app/lib/contexts/ServersContext";
type ActionIcon = React.FC<{ user: User; className?: string }>;

const NavigationSections = [
	{
		name: "Direct Messages",
		href: "/",
		icon: BsChatDotsFill,
		description: "Direct Messages",
	},
	{
		name: "Add New",
		href: null,
		icon: CreateServerFormDialog,
		description: "Add/Join a server",
	},
	{
		name: "Discover",
		href: "/discover",
		icon: RiCompassDiscoverFill,
		description: "Discover Communities",
	},
	// {
	// 	name: "Star",
	// 	href: "https://github.com/calvintaw/discord_clone",
	// 	icon: FaStar,
	// 	description: "Star my repo ;)",
	// 	external: true,
	// },
];

const NavigationBar = ({ user, joined_servers }: { user: User; joined_servers: Room[] }) => {
	const { setJoinedServers } = useServersProvider();

	useEffect(() => {
		setJoinedServers(joined_servers);
	}, []);

	const pathname = usePathname();
	const nav_icon_styles =
		"group hover:bg-primary not-dark:hover:bg-foreground border-2 border-transparent max-sm:!rounded-lg !rounded-xl max-sm:!size-10 !size-11.5";

	return (
		<>
			<aside
				id="nav-bar"
				className="
			bg-background
			flex items-start flex-col max-sm:gap-1.5 gap-1 h-full w-fit py-2 sticky top-0 navigation-bar
			min-w-[52px]
			max-lg:border-r
			dark:border-surface border-surface/10

			"
			>
				<DashboardBtn />
				{NavigationSections.map((icon, index) => {
					if (icon.href !== null) {
						const Icon = icon.icon as IconType;

						return (
							<Link
								//@ts-ignore
								target={icon.external ? "_blank" : "_self"}
								href={icon.href as Route}
								role="navigation"
								key={index}
								className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center"}
							>
								<hr
									className={clsx(
										"absolute",
										pathname === icon.href &&
											"bg-foreground w-0.5 rounded-r-2xl border-foreground max-sm:border-1 border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
									)}
								/>
								<IconWithSVG
									data-tooltip-id={`navigation-bar-tooltips`}
									data-tooltip-content={icon.description}
									className={clsx(nav_icon_styles, pathname === icon.href && "bg-primary not-dark:bg-foreground")}
								>
									<Icon
										className={clsx(
											"not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]",
											pathname === icon.href && "not-dark:!text-white",

											//@ts-ignore
											icon.external && "text-yellow-400"
										)}
									/>
								</IconWithSVG>
							</Link>
						);
					} else {
						const Icon = icon.icon as ActionIcon;
						return (
							<div
								role="navigation"
								key={index}
								className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center"}
							>
								<hr
									className={clsx(
										"absolute",
										pathname === icon.href &&
											"bg-foreground w-0.5 rounded-r-2xl border-foreground max-sm:border-1 border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
									)}
								/>
								<IconWithSVG
									data-tooltip-id={`navigation-bar-tooltips`}
									data-tooltip-content={icon.description}
									className={clsx(nav_icon_styles, pathname === icon.href && "bg-primary not-dark:bg-foreground")}
								>
									<Icon
										user={{ ...user, createdAt: user.createdAt ?? "" }}
										className={clsx(
											"not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]",
											pathname === icon.href && "not-dark:!text-white"
										)}
									/>
								</IconWithSVG>
							</div>
						);
					}
				})}

				{/* <SeeMoreBtn /> */}
				{joined_servers &&
					joined_servers.length > 0 &&
					joined_servers.map((server, idx) => {
						if (idx === 4) return <SeeMoreBtn />;
						if (idx > 4) return null;

						return (
							<Link
								href={`/chat/server/${server.id}`}
								role="navigation"
								key={server.id}
								className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center"}
							>
								<hr
									className={clsx(
										"absolute",
										pathname === `/chat/server/${server.id}` &&
											"bg-foreground w-0.5 rounded-r-2xl border-foreground max-sm:border-1 border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
									)}
								/>
								<Avatar
									disableTooltip
									size="size-11.5 max-sm:size-10"
									radius="rounded-xl"
									src={server.profile ?? ""}
									displayName={server.name}
									statusIndicator={false}
									data-tooltip-id={"navigation-bar-tooltips"}
									data-tooltip-content={server.name}
									border={pathname === `/chat/server/${server.id}` ? "border-2 border-primary" : ""}
								></Avatar>
							</Link>
						);
					})}
			</aside>

			<Tooltip className="my-tooltip" id={`navigation-bar-tooltips`} border={`var(--tooltip-border)`} place="right" />
		</>
	);
};

const DashboardBtn = () => {
	const handleResize = () => {
		const isLargeScreen = window.innerWidth > 767;
		if (isLargeScreen) {
			document?.getElementById("sidebar")?.classList.remove("active");
		}
	};

	useEffect(() => {
		if (typeof window === "undefined") return;
		handleResize();
	}, []);

	if (typeof window !== "undefined") {
		useEventListener("resize", handleResize);
	}

	const nav_icon_styles =
		"group hover:bg-primary not-dark:hover:bg-foreground border-2 border-transparent max-sm:!rounded-lg !rounded-xl max-sm:!size-10 !size-11.5 cursor-ew-resize";

	return (
		<div className={"lg:hidden px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center z-50"}>
			<IconWithSVG
				onClick={() => {
					document?.getElementById("sidebar")?.classList.toggle("active");
				}}
				data-tooltip-id={"navigation-bar-tooltips"}
				data-tooltip-content={"Toggle Sidebar"}
				className={nav_icon_styles}
			>
				<MdSpaceDashboard className={"not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]"} />
			</IconWithSVG>
		</div>
	);
};

export default NavigationBar;

const SeeMoreBtn = () => {
	const nav_icon_styles =
		"group hover:bg-primary not-dark:hover:bg-foreground border-2 border-transparent max-sm:!rounded-lg !rounded-xl max-sm:!size-10 !size-11.5";

	return (
		<Link
			href={"/discover?joined=true"}
			data-tooltip-id={`navigation-bar-tooltips`}
			data-tooltip-content={"View all joined servers"}
			role="navigation"
			key={"nav-see-more-btn"}
			className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center no-underline"}
		>
			<IconWithSVG className={nav_icon_styles}>
				<HiDotsHorizontal className="not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]" />
			</IconWithSVG>
		</Link>
	);
};

// test rooms
// const rooms: Room[] = [
// 	{
// 		id: "room1",
// 		owner_id: "user1",
// 		name: "General Chat",
// 		description: "A place for everyone to hang out",
// 		type: "public",
// 		created_at: "2025-10-01T10:00:00Z",
// 		online_members: 12,
// 		total_members: 50,
// 		banner: "https://example.com/banners/general.png",
// 		profile: "https://example.com/profiles/general.png",
// 	},
// 	{
// 		id: "room2",
// 		owner_id: "user2",
// 		name: "Gaming Zone",
// 		description: "Discuss the latest games",
// 		type: "private",
// 		created_at: "2025-09-28T15:30:00Z",
// 		online_members: 8,
// 		total_members: 25,
// 		banner: "https://example.com/banners/gaming.png",
// 		profile: "https://example.com/profiles/gaming.png",
// 	},
// 	{
// 		id: "room3",
// 		owner_id: "user3",
// 		name: "Study Group",
// 		description: "Collaborate on projects and assignments",
// 		type: "public",
// 		created_at: "2025-10-01T08:45:00Z",
// 		online_members: 5,
// 		total_members: 20,
// 		banner: "https://example.com/banners/study.png",
// 		profile: "https://example.com/profiles/study.png",
// 	},
// 	{
// 		id: "room4",
// 		owner_id: "user4",
// 		name: "Music Lovers",
// 		description: "Share and discuss your favorite music",
// 		type: "public",
// 		created_at: "2025-09-25T12:00:00Z",
// 		online_members: 7,
// 		total_members: 30,
// 		banner: "https://example.com/banners/music.png",
// 		profile: "https://example.com/profiles/music.png",
// 	},
// 	{
// 		id: "room5",
// 		owner_id: "user5",
// 		name: "Fitness Club",
// 		description: "Talk about workouts and healthy living",
// 		type: "private",
// 		created_at: "2025-09-30T09:15:00Z",
// 		online_members: 3,
// 		total_members: 15,
// 		banner: "https://example.com/banners/fitness.png",
// 		profile: "https://example.com/profiles/fitness.png",
// 	},
// 	{
// 		id: "room6",
// 		owner_id: "user6",
// 		name: "Tech Talk",
// 		description: "Discuss the latest in technology and coding",
// 		type: "public",
// 		created_at: "2025-10-01T07:30:00Z",
// 		online_members: 10,
// 		total_members: 40,
// 		banner: "https://example.com/banners/tech.png",
// 		profile: "https://example.com/profiles/tech.png",
// 	},
// ];
