import { NavigationSections } from "@/app/lib/utilities";
import clsx from "clsx";
import { IconWithSVG } from "../../general/Buttons";

export const NavigationBarSkeleton = () => {
	const nav_icon_styles =
		"group border-2 border-transparent max-sm:!rounded-lg !rounded-xl max-sm:!size-10 !size-11.5 bg-surface animate-pulse";

	return (
		<aside
			id="nav-bar"
			className="
				bg-background
				flex items-start flex-col max-sm:gap-1.5 gap-1 h-full w-fit py-2 sticky top-0 
				min-w-13
				max-lg:border-r
				dark:border-surface border-surface
			"
		>
			{/* Dashboard placeholder */}
			<div className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center"}>
				<IconWithSVG className={clsx(nav_icon_styles, "w-11.5 h-11.5 max-sm:w-10 max-sm:h-10 rounded-xl")} />
			</div>

			{/* Navigation icons placeholders */}
			{NavigationSections.map((icon, index) => (
				<div key={index} className={"px-2 max-sm:px-1.5 sm:min-h-13 relative flex items-center justify-center"}>
					<IconWithSVG className={clsx(nav_icon_styles, "w-11.5 h-11.5 max-sm:w-10 max-sm:h-10 rounded-xl")} />
				</div>
			))}
		</aside>
	);
};
