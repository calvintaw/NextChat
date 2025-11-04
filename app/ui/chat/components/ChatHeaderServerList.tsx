import { Room } from "@/app/lib/definitions";
import clsx from "clsx";
import Link from "next/link";
import { Avatar } from "../../general/Avatar";

export const ServerList = ({ servers }: { servers: Room[] }) => {
	if (!servers || servers.length === 0) {
		return <p className="text-xs text-gray-500 mt-2">No servers in common</p>;
	}

	return (
		<div className="flex flex-wrap gap-2">
			{servers.map((server) => (
				<Link
					key={server.id}
					href={server.type === "dm" ? `/chat/${server.id}` : `/chat/server/${server.id}`}
					className={clsx(
						"flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors duration-150",
						"bg-background/50 hover:bg-background/70 dark:bg-accent/50 dark:hover:bg-accent/70"
					)}
				>
					<Avatar
						src={server.profile ?? ""}
						displayName={server.name}
						size="size-8"
						radius="rounded-md"
						fontSize="text-sm"
						statusIndicator={false}
					/>
					<span className="font-medium text-sm truncate">{server.name}</span>
				</Link>
			))}
		</div>
	);
};
