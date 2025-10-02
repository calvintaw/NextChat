"use client";
import * as Toast from "@radix-ui/react-toast";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import { toastAtom } from "../store";
import { RxCross2 } from "react-icons/rx";
import { IconWithSVG } from "./general/Buttons";

const Toaster = () => {
	const [{ list }] = useAtom(toastAtom);

	return (
		<Toast.Provider swipeDirection="right">
			{list.map((props) => (
				<SingleToast {...props} key={props.id} />
			))}
			<Toast.Viewport className="fixed bottom-8 right-8 flex flex-col gap-3 min-w-80 max-w-125 m-0 list-none !z-[999] outline-none " />
		</Toast.Provider>
	);
};

const modes: { [type: string]: { textColor: string; borderColor: string; bgColor: string } } = {
	positive: { textColor: "text-success", borderColor: "border-success", bgColor: "bg-success/25" },
	negative: {
		textColor: "text-red-400 not-dark:text-red-500",
		borderColor: "border-red-400 not-dark:text-red-500",
		bgColor: "bg-error/25",
	},
	info: { textColor: "text-primary", borderColor: "border-primary", bgColor: "bg-primary/25" },
};

const SingleToast = ({
	id,
	open = true,
	title = "",
	subtitle = "",
	mode = "info",
	timer = 3000,
	infinite = false,
}: {
	id?: number;
	open?: boolean;
	title: string;
	subtitle: string;
	mode?: string;
	timer?: number;
	infinite?: boolean;
}) => {
	const [_, setToast] = useAtom(toastAtom);
	const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

	const removeToast = () => {
		setToast((state) => {
			state.list = state.list.filter((toast) => toast.id != id);
		});
		timerRef.current && clearTimeout(timerRef.current);
	};

	const setTimer = () => {
		timerRef.current = setTimeout(() => {
			removeToast();
			clearTimeout(timerRef.current);
		}, timer + 1000);
	};

	useEffect(() => {
		!infinite && setTimer();
	}, []);

	return (
		<Toast.Root
			className={`${modes[mode].borderColor} relative border-1 border-accent/50  rounded-md shadow-foreground/25 dark:!shadow-foreground/5 !shadow-md px-3.75 py-3 grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-3.75 items-center bg-white dark:bg-surface`}
			duration={Infinity}
		>
			<Toast.Title className={`font-bold ${modes[mode].textColor}`}>{title}</Toast.Title>
			<Toast.Description className="text-base">{subtitle}</Toast.Description>
			<Toast.Action className="[grid-area:_action]" asChild altText="Dismiss">
				<Toast.Close aria-label="Close" asChild onClick={removeToast}>
					<IconWithSVG
						className="
						bg-surface
						dark:bg-secondary text-text
						rounded-sm
						!size-7
						hover:bg-accent					
						"
					>
						<RxCross2 className="text-xl" />
					</IconWithSVG>
				</Toast.Close>
			</Toast.Action>
		</Toast.Root>
	);
};

export default Toaster;
