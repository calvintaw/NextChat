"use client";
import { Children, cloneElement, isValidElement, useState } from "react";
import useDarkMode from "../../lib/hooks/useDarkMode";
import { FaCircleHalfStroke } from "react-icons/fa6";
import clsx from "clsx";
import { MdLightMode, MdDarkMode } from "react-icons/md";

export function MenuIcon() {
	const [active, setActive] = useState(false);

	const bgColor = "bg-foreground";
	const activeColors = "hover:bg-surface active:bg-surface";

	return (
		<button
			onClick={() => setActive((prev) => !prev)}
			className={`icon-secondary rounded group p-0 size-9 flex flex-col items-center justify-center cursor-pointer relative ${activeColors}`}
		>
			<span
				className={`absolute bg-foreground w-5 h-0.5 ${bgColor} rounded-full transition-all duration-300 ease-in-out
          ${active ? "rotate-45 translate-y-0" : "-translate-y-[0.375rem]"}
        `}
			></span>

			<span
				className={`absolute bg-foreground w-5 h-0.5 ${bgColor} rounded-full transition-all duration-300 ease-in-out
          ${active ? "opacity-0" : ""}
        `}
			></span>

			<span
				className={`absolute bg-foreground w-5 h-0.5 ${bgColor} rounded-full transition-all duration-300 ease-in-out
          ${active ? "-rotate-45 translate-y-0" : "translate-y-[0.375rem]"}
        `}
			></span>
		</button>
	);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;
type IconProps = ButtonProps;

export function Button(props: React.PropsWithChildren<ButtonProps>) {
	const { children, className = "", ...rest } = props;

	return (
		<button className={`btn btn-primary ${className}`} {...rest}>
			{children}
		</button>
	);
}

export function Icon(props: React.PropsWithChildren<IconProps>) {
	const { children, className, ...rest } = props;
	return (
		<button {...rest} className={`icon ${className ?? ""}`}>
			{children}
		</button>
	);
}

export function IconWithSVG(props: React.PropsWithChildren<IconProps>) {
	const { children, className, ...rest } = props;
	const new_children = Children.map(children, (child) => {
		if (isValidElement<React.HTMLAttributes<HTMLElement>>(child)) {
			return cloneElement(child, {
				className: clsx(child.props.className, "absolute inset-0 m-auto text-2xl"),
			});
		}
		return child;
	});

	return (
		<Icon {...rest} className={`icon flex items-center justify-center size-12 rounded-md relative ${className ?? ""}`}>
			{new_children}
		</Icon>
	);
}

export const DarkModeBtn = ({ className }: { className?: string }) => {
	const [darkMode, toggle] = useDarkMode();
	const icon_class = "absolute inset-0 m-auto text-2xl not-dark:group-hover:text-background";

	return (
		<button
			onClick={toggle}
			title="Toggle Dark Mode"
			className={clsx(
				"btn icon size-12 rounded-md relative group hover:bg-primary not-dark:hover:bg-foreground hover:rounded-[12px] border-2 border-transparent hover:border-background",
				className
			)}
		>
			{darkMode && <MdLightMode className={icon_class}></MdLightMode>}
			{!darkMode && <MdDarkMode className={icon_class}></MdDarkMode>}
		</button>
	);
};

interface BadgeProps {
	count: number;
	max?: number;
	className?: string;
}

export const Badge = ({ count, max = 9, className }: BadgeProps) => {
	const display = count > max ? `${max}+` : count;

	return (
		<span
			className={clsx(
				"inline-flex size-6 text-xs font-light text-white bg-error rounded-full items-center justify-center",
				className
			)}
		>
			{display}
		</span>
	);
};
