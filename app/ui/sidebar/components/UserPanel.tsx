"use client";
import React, { useEffect, useState } from "react";
import { TbLogout } from "react-icons/tb";
import { IoMdSettings } from "react-icons/io";
import { DarkModeBtn, IconWithSVG } from "../../general/Buttons";
import { Avatar } from "../../general/Avatar";
import { Tooltip } from "react-tooltip";
import { User } from "@/app/lib/definitions";
import { signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type Props = {
	user: User;
};

const UserPanel = ({ user }: Props) => {
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		setIsOnline(window.navigator.onLine);

		const goOnline = () => setIsOnline(true);
		const goOffline = () => setIsOnline(false);

		window.addEventListener("online", goOnline);
		window.addEventListener("offline", goOffline);

		return () => {
			window.removeEventListener("online", goOnline);
			window.removeEventListener("offline", goOffline);
		};
	}, []);

	return (
		<div
			className="@container !absolute !bottom-4.5 !left-2 !right-2.5 z-40

		max-lg:[#sidebar.active_&]:!min-w-78
		max-lg:[#sidebar.active_&]:!max-w-81
		max-sm:[#sidebar.active_&]:!w-[300px]
		"
		>
			<div className="hidden [#sidebar.active_&]:!flex @min-[200px]:flex p-1 bg-surface rounded-lg border-2 border-contrast items-center gap-1">
				<div className=" @min-[200px]:pl-1 @min-[200px]:w-fit w-full flex items-center justify-center">
					<Avatar id={user.id} status={isOnline} src={user.image} displayName={user.displayName}></Avatar>
				</div>
				<div
					className="hidden [#sidebar.active_&]:!flex @min-[200px]:flex flex-1
				
				
				
				[#sidebar.active_&]:!py-1
				[#sidebar.active_&]:!pr-1
				@min-[200px]:py-1 @min-[200px]:pr-1"
				>
					<div className="  ml-2 flex flex-1 flex-col justify-center overflow-hidden ">
						<p className="text-sm font-semibold text-text truncate max-w-35 leading-tight">{user.displayName}</p>
						<p className="text-xs font-medium text-muted">{isOnline ? "Online" : "Offline"}</p>
					</div>
					<Buttons />
				</div>
			</div>

			<DropdownMenu.Root modal={false}>
				<DropdownMenu.Trigger asChild className="@min-[200px]:hidden [#sidebar.active_&]:!hidden">
					<button className="flex items-center justify-center w-full -mt-12.5 bg-transparent  p-0">
						<Avatar id={user.id} status={isOnline} src={user.image} displayName={user.displayName}></Avatar>
					</button>
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						side="top"
						align="center"
						sideOffset={10}
						collisionPadding={8}
						className="w-full bg-surface rounded-md p-2 shadow-lg shadow-foreground/20 dark:shadow-foreground/5 border-2 border-border"
					>
						<div className="flex items-center gap-2">
							<Buttons />
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	);
};

const Buttons = () => {
	const [enabled, setEnabled] = useState(true);

	useEffect(() => {
		setEnabled(!document.documentElement.classList.contains("disable-stars-bg"));
	}, []);

	const handleToggle = () => {
		if (typeof window === "undefined") return;
		document.documentElement.classList.toggle("disable-stars-bg");
		setEnabled(!document.documentElement.classList.contains("disable-stars-bg"));
	};

	return (
		<>
			<span data-tooltip-id="tooltip-darkmode">
				<DarkModeBtn className="!size-9 group dark:hover:!bg-background" />
				<Tooltip offset={15} className="my-tooltip" id="tooltip-darkmode" place="top" border={`var(--tooltip-border)`}>
					<span>Toggle dark mode</span>
				</Tooltip>
			</span>

			<span data-tooltip-id="tooltip-settings">
				<IconWithSVG className="!size-9 group hover:bg-background" onClick={handleToggle}>
					<IoMdSettings className="group-hover:animate-spin-delay" />
				</IconWithSVG>
				<Tooltip offset={15} className="my-tooltip" id="tooltip-settings" place="top" border={`var(--tooltip-border)`}>
					<span>{enabled ? "Disable" : "Enable"} stars background</span>
				</Tooltip>
			</span>

			<span data-tooltip-id="tooltip-logout">
				<IconWithSVG onClick={() => signOut({ callbackUrl: "/login" })} className="!size-9 hover:bg-background">
					<TbLogout />
				</IconWithSVG>
				<Tooltip offset={15} className="my-tooltip" id="tooltip-logout" place="top" border={`var(--tooltip-border)`}>
					<span>Logout</span>
				</Tooltip>
			</span>
		</>
	);
};

export default UserPanel;
