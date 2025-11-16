import { Room } from "@/app/lib/definitions";
import { Avatar } from "@/app/ui/general/Avatar";
import clsx from "clsx";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { MdExpandLess, MdExpandMore } from "react-icons/md";

export const ServerList = ({ servers }: { servers: Room[] }) => {
	if (!servers || servers.length === 0) {
		return <p className="text-xs text-gray-500 mt-2">No servers in common</p>;
	}

	const [showAll, setShowAll] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const toggleBtnWidth = 116; // Show More/Less btn is 107px wide + margin left width
	const [visibleCount, setVisibleCount] = useState(servers.length);

	// Estimate width of a server card based on avatar and name
	const estimateCardWidth = (server: Room) => {
		const avatarWidth = 24; // px, size-6 avatar
		const padding = 12; // left + right padding in px
		const gap = 8; // gap between avatar and text
		const charWidth = 7; // average width per character in px
		const nameWidth = Math.min(server.name.length, 15) * charWidth; // truncate to max chars
		return avatarWidth + padding + gap + nameWidth;
	};

	const calculateVisibleCount = () => {
		if (!containerRef.current) return;

		const containerWidth = Math.min(containerRef.current.offsetWidth, window.innerWidth) - toggleBtnWidth;
		let usedWidth = 0;
		let count = 0;

		for (let i = 0; i < servers.length; i++) {
			const cardWidth = estimateCardWidth(servers[i]) + 4; // +gap between items
			if (usedWidth + cardWidth <= containerWidth) {
				usedWidth += cardWidth;
				count++;
			} else break;
		}

		setVisibleCount(Math.max(count, 1)); // show at least 1
	};

	useEffect(() => {
		calculateVisibleCount();
		window.addEventListener("resize", calculateVisibleCount);
		return () => window.removeEventListener("resize", calculateVisibleCount);
	}, [servers, showAll]);

	const displayedServers = showAll ? servers : servers.slice(0, visibleCount);

	return (
		<div className="p-1.5 rounded-md bg-background">
			<p className="text-xs font-medium text-muted">Servers in common: </p>{" "}
			<hr className="hr-separator mb-2 mt-0.5 bg-contrast" />
			<div ref={containerRef} className="flex flex-wrap gap-1 flex-1 items-center">
				{displayedServers.map((server) => (
					<Link
						key={server.id}
						href={server.type === "dm" ? `/chat/${server.id}` : `/chat/server/${server.id}`}
						className={clsx(
							"flex items-center gap-1.5 p-1 pr-1.5 rounded-sm no-underline decoration-0 cursor-pointer transition-colors duration-150",
							"bg-background/50 hover:bg-background/70 dark:bg-accent/50 dark:hover:bg-accent/70"
						)}
					>
						<Avatar
							disableTooltip
							src={server.profile ?? ""}
							displayName={server.name}
							size="size-6"
							radius="rounded-sm"
							fontSize="text-sm"
							statusIndicator={false}
						/>
						<span className="text-xs max-w-[15ch] text-text truncate">{server.name}</span>
					</Link>
				))}
				{servers.length > visibleCount && (
					<button
						className="ml-2 btn btn-small h-8 rounded-full bg-background hover:bg-accent btn-secondary !w-fit btn-with-icon flex items-center gap-0.5 px-2 pl-1 text-sm"
						onClick={() => setShowAll((prev) => !prev)}
					>
						{showAll ? <MdExpandLess className="text-lg" /> : <MdExpandMore className="text-lg" />}
						{showAll ? "Show Less" : "Show More"}
					</button>
				)}
			</div>
		</div>
	);
};

const rooms: Room[] = [
	{
		id: "r1",
		owner_id: "u1",
		name: "General",
		description: "General discussion",
		type: "public",
		created_at: "2025-01-01T10:00:00Z",
		profile: "https://example.com/room1.png",
		banner: null,
		online_members: 5,
		total_members: 50,
	},
	{
		id: "r2",
		owner_id: "u2",
		name: "Project X",
		description: "Project X discussions",
		type: "private",
		created_at: "2025-01-02T10:00:00Z",
		profile: "https://example.com/room2.png",
		banner: null,
		online_members: 3,
		total_members: 10,
	},
	{
		id: "r3",
		owner_id: "u3",
		name: "Marketing",
		description: "Marketing team chat",
		type: "public",
		created_at: "2025-01-03T10:00:00Z",
		profile: "https://example.com/room3.png",
		banner: null,
		online_members: 2,
		total_members: 20,
	},
	{
		id: "r4",
		owner_id: "u4",
		name: "Support",
		description: "Support team channel",
		type: "private",
		created_at: "2025-01-04T10:00:00Z",
		profile: "https://example.com/room4.png",
		banner: null,
		online_members: 1,
		total_members: 15,
	},
	{
		id: "r5",
		owner_id: "u5",
		name: "Dev Team",
		description: "Developers only",
		type: "public",
		created_at: "2025-01-05T10:00:00Z",
		profile: "https://example.com/room5.png",
		banner: null,
		online_members: 4,
		total_members: 25,
	},
	{
		id: "r6",
		owner_id: "u6",
		name: "QA",
		description: "Quality Assurance",
		type: "private",
		created_at: "2025-01-06T10:00:00Z",
		profile: "https://example.com/room6.png",
		banner: null,
		online_members: 3,
		total_members: 12,
	},
	{
		id: "r7",
		owner_id: "u7",
		name: "Design",
		description: "Design team",
		type: "public",
		created_at: "2025-01-07T10:00:00Z",
		profile: "https://example.com/room7.png",
		banner: null,
		online_members: 2,
		total_members: 18,
	},
	{
		id: "r8",
		owner_id: "u8",
		name: "HR",
		description: "Human Resources",
		type: "private",
		created_at: "2025-01-08T10:00:00Z",
		profile: "https://example.com/room8.png",
		banner: null,
		online_members: 1,
		total_members: 10,
	},
	{
		id: "r9",
		owner_id: "u9",
		name: "Finance",
		description: "Finance discussions",
		type: "public",
		created_at: "2025-01-09T10:00:00Z",
		profile: "https://example.com/room9.png",
		banner: null,
		online_members: 2,
		total_members: 14,
	},
	{
		id: "r10",
		owner_id: "u10",
		name: "Ops Team",
		description: "Operations team chat",
		type: "private",
		created_at: "2025-01-10T10:00:00Z",
		profile: "https://example.com/room10.png",
		banner: null,
		online_members: 3,
		total_members: 20,
	},
	{
		id: "r11",
		owner_id: "u11",
		name: "Social",
		description: "Casual talk",
		type: "public",
		created_at: "2025-01-11T10:00:00Z",
		profile: "https://example.com/room11.png",
		banner: null,
		online_members: 6,
		total_members: 30,
	},
	{
		id: "r12",
		owner_id: "u12",
		name: "Announcementdjsadkandkandkjnaskndndkankandkandajksdnas",
		description: "Company announcements",
		type: "private",
		created_at: "2025-01-12T10:00:00Z",
		profile: "https://example.com/room12.png",
		banner: null,
		online_members: 1,
		total_members: 50,
	},
	{
		id: "r13",
		owner_id: "u13",
		name: "Project Y",
		description: "Project Y discussions",
		type: "public",
		created_at: "2025-01-13T10:00:00Z",
		profile: "https://example.com/room13.png",
		banner: null,
		online_members: 3,
		total_members: 20,
	},
	{
		id: "r14",
		owner_id: "u14",
		name: "Team Lounge",
		description: "Casual team chat",
		type: "private",
		created_at: "2025-01-14T10:00:00Z",
		profile: "https://example.com/room14.png",
		banner: null,
		online_members: 2,
		total_members: 15,
	},
	{
		id: "r15",
		owner_id: "u15",
		name: "Research",
		description: "Research discussions",
		type: "public",
		created_at: "2025-01-15T10:00:00Z",
		profile: "https://example.com/room15.png",
		banner: null,
		online_members: 4,
		total_members: 18,
	},
	{
		id: "r16",
		owner_id: "u16",
		name: "Legal",
		description: "Legal team",
		type: "private",
		created_at: "2025-01-16T10:00:00Z",
		profile: "https://example.com/room16.png",
		banner: null,
		online_members: 1,
		total_members: 8,
	},
	{
		id: "r17",
		owner_id: "u17",
		name: "Community",
		description: "Community chat",
		type: "public",
		created_at: "2025-01-17T10:00:00Z",
		profile: "https://example.com/room17.png",
		banner: null,
		online_members: 5,
		total_members: 40,
	},
	{
		id: "r18",
		owner_id: "u18",
		name: "Partners",
		description: "Partner discussions",
		type: "private",
		created_at: "2025-01-18T10:00:00Z",
		profile: "https://example.com/room18.png",
		banner: null,
		online_members: 2,
		total_members: 12,
	},
	{
		id: "r19",
		owner_id: "u19",
		name: "Tech Talk",
		description: "Tech discussions",
		type: "public",
		created_at: "2025-01-19T10:00:00Z",
		profile: "https://example.com/room19.png",
		banner: null,
		online_members: 3,
		total_members: 25,
	},
	{
		id: "r20",
		owner_id: "u20",
		name: "Random",
		description: "Random chat",
		type: "private",
		created_at: "2025-01-20T10:00:00Z",
		profile: "https://example.com/room20.png",
		banner: null,
		online_members: 2,
		total_members: 10,
	},
];
