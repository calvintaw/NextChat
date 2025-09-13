"use client"
import { Icon } from "@iconify-icon/react";
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
			<Toast.Viewport className="fixed bottom-0 right-0 flex flex-col p-8 gap-3 w-96  max-w-screen m-0 list-none !z-[999] outline-none " />
		</Toast.Provider>
	);
};

const modes: { [type: string]: { textColor: string; borderColor: string } } = {
	positive: { textColor: "text-success", borderColor: "border-success" },
	negative: { textColor: "text-error", borderColor: "border-error" },
	info: { textColor: "text-primary", borderColor: "border-primary" },
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
			className={`${modes[mode].borderColor} border-1 border-accent/50 bg-white dark:bg-surface rounded-md shadow-foreground/20 !shadow-md px-3.75 py-3 grid [grid-template-areas:_'title_action'_'description_action'] grid-cols-[auto_max-content] gap-x-3.75 items-center `}
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
						<RxCross2 className="text-xl"/>
					</IconWithSVG>
				</Toast.Close>
			</Toast.Action>
		</Toast.Root>
	);
};

export default Toaster;
