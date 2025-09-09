"use client";
import React from "react";
import {  MdSpaceDashboard } from "react-icons/md";
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
type ActionIcon = React.FC<{ user: User; className?: string }>


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
		description: "Add a server",
	},
	{
		name: "Discover",
		href: "/discover",
		icon: RiCompassDiscoverFill,
		description: "Discover",
	},
];


const NavigationBar = ({ user, joined_servers }: { user: User, joined_servers: Room[]}) => {
	const pathname = usePathname();
	console.log("pathname: ",pathname)
	const nav_icon_styles =
		"group hover:bg-primary not-dark:hover:bg-foreground border-2 border-transparent !rounded-xl !size-[46px]";

	return (
		<>
			<aside
				id="nav-bar"
				className="
			bg-background
			flex items-start flex-col gap-1 h-full w-fit py-2 border-contrast sticky top-0 md:border-r navigation-bar
			[#sidebar.active_&]:!border-r-2	
			"
			>
				<DashboardBtn />
				{NavigationSections.map((icon, index) => {
					
					
					
					if (icon.href !== null) {
						const Icon = icon.icon as IconType;
						
						return (<Link
							href={icon.href as Route}
							role="navigation"
							key={index}
							className={"px-2 min-h-[52px] relative flex items-center justify-center"}
						>
							<hr
								className={clsx(
									"absolute",
									pathname === icon.href &&
										"bg-foreground w-0.5 rounded-r-2xl border-foreground border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
								)}
							/>
							<IconWithSVG
								data-tooltip-id={"navigation-bar-tooltips"}
								data-tooltip-content={icon.description}
								className={clsx(nav_icon_styles, pathname === icon.href && "bg-primary not-dark:bg-foreground")}
							>
								<Icon
									className={clsx(
										"not-dark:group-hover:text-background text-[24px]",
										pathname === icon.href && "not-dark:!text-white"
									)}							/>
							</IconWithSVG>
						</Link>)
					} else {
						const Icon = icon.icon as ActionIcon;
						return (
							<div
								role="navigation"
								key={index}
								className={"px-2 min-h-[52px] relative flex items-center justify-center"}
							>
								<hr
									className={clsx(
										"absolute",
										pathname === icon.href &&
											"bg-foreground w-0.5 rounded-r-2xl border-foreground border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
									)}
								/>
								<IconWithSVG
									data-tooltip-id={"navigation-bar-tooltips"}
									data-tooltip-content={icon.description}
									className={clsx(nav_icon_styles, pathname === icon.href && "bg-primary not-dark:bg-foreground")}
								>
									<Icon
										user={{ ...user, createdAt: user.createdAt ?? "" }}
										className={clsx(
											"not-dark:group-hover:text-background text-[24px]",
											pathname === icon.href && "not-dark:!text-white"
										)}
									/>
								</IconWithSVG>
							</div>
						);

					}
						
					
				})}

				{joined_servers &&
					joined_servers.length > 0 &&
					joined_servers.map((server) => (
						<Link
							href={`/chat/server/${server.id}`}
							role="navigation"
							key={server.id}
							className={"px-2 min-h-[52px] relative flex items-center justify-center"}
						>
							<hr
								className={clsx(
									"absolute",
									pathname === `/chat/server/${server.id}` &&
										"bg-foreground w-0.5 rounded-r-2xl border-foreground border-2 top-1/2 -translate-y-1/2 h-[65%] left-0"
								)}
							/>
							<Avatar
								size="size-[46px]"
								radius="rounded-xl"
								src={server.profile ?? ""}
								displayName={server.name}
								statusIndicator={false}
								data-tooltip-id={"navigation-bar-tooltips"}
								data-tooltip-content={server.name}
								border={pathname === `/chat/server/${server.id}` ? "border-2 border-primary" : ""}
							></Avatar>
						</Link>
					))}
			</aside>

			<Tooltip className="my-tooltip" id={"navigation-bar-tooltips"} border={`var(--tooltip-border)`} place="right" />
		</>
	);
};

const DashboardBtn = () => {
		const nav_icon_styles =
			"group hover:bg-primary not-dark:hover:bg-foreground border-2 border-transparent !rounded-xl !size-[46px]";

	return (
		<div className={"lg:hidden  px-2 min-h-[52px] relative flex items-center justify-center z-50"}>
			<IconWithSVG
				onClick={() => {
					document?.getElementById("sidebar")?.classList.toggle("active");
				}}
				data-tooltip-id={"navigation-bar-tooltips"}
				data-tooltip-content={"Toggle Sidebar"}
				className={nav_icon_styles}
			>
				<MdSpaceDashboard className={"not-dark:group-hover:text-background text-[24px]"} />
			</IconWithSVG>
		</div>
	);
}

export default NavigationBar;
