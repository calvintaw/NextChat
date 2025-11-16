"use client";
import React, { useEffect, useState } from "react";
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
import { IoLogoPolymer } from "react-icons/io";
import { FiSidebar } from "react-icons/fi";
import { NavigationSections } from "@/app/lib/utilities";
type ActionIcon = React.FC<{ user: User; className?: string }>;

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
			min-w-13
			max-lg:border-r
			dark:border-surface border-surface

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
	const [isHovered, setIsHovered] = useState(false);

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
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{!isHovered && (
					<IoLogoPolymer
						className={"not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]"}
					></IoLogoPolymer>
				)}
				{isHovered && <FiSidebar className={"not-dark:group-hover:text-background text-[24px] max-sm:text-[20px]"} />}
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
