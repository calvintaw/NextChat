import { getUserByUsername, createDM } from "@/app/lib/actions";
import InputField from "@/app/ui/form/InputField";
import { Avatar } from "@/app/ui/general/Avatar";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import * as Dialog from "@radix-ui/react-dialog";
import { User } from "@/app/lib/definitions";
import { useState } from "react";
import { BiLoaderAlt } from "react-icons/bi";
import { FaPlus } from "react-icons/fa";
import { HiOutlineX } from "react-icons/hi";
import { IoSearch } from "react-icons/io5";

export const CreateDMButton = ({ currentUser }: { currentUser: User }) => {
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	const handleSubmit = async (username: string) => {
		if (username === currentUser.username) {
			setError("Invalid DM");
			return;
		}

		if (!username) {
			setError("Username is required");
			return;
		}

		setIsPending(true);
		setError(null);

		try {
			const normalizedUsername = username.startsWith("@") ? username.slice(1) : username;
			const fetchedUser = await getUserByUsername(normalizedUsername);
			if (!fetchedUser) {
				setError("User not found");
			} else {
				setUser(fetchedUser);
			}
		} catch (err) {
			setError("An error occurred");
		} finally {
			setIsPending(false);
		}
	};

	const [username, setUsername] = useState("");

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<FaPlus
					data-tooltip-id="dm-icon-tooltip"
					data-tooltip-content="Create DM"
					className="hover:text-text text-muted ml-auto text-sm"
				/>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 pt-4 w-full max-w-md shadow-lg border border-border z-[12000]">
					<Dialog.Close asChild className="!absolute !top-2 !right-2">
						<IconWithSVG className="!rounded-md icon-small bg-accent/40 hover:bg-accent/60">
							<HiOutlineX />
						</IconWithSVG>
					</Dialog.Close>
					<Dialog.Title className="text-xl font-semibold text-text mb-4">Create a new DM</Dialog.Title>

					<div className="w-full md:ml-auto mb-4">
						<InputField
							name="q"
							type="text"
							placeholder="Enter username"
							disabled={isPending}
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSubmit(username);
							}}
							place="right"
							className="w-full flex-1"
							parentClassName="w-full min-h-0 h-10 px-1.5"
							icon={
								<IconWithSVG className="icon-small" onClick={() => handleSubmit(username)}>
									{isPending ? <BiLoaderAlt className="animate-spin text-lg" /> : <IoSearch />}
								</IconWithSVG>
							}
						/>
					</div>

					{(isPending || !user) && <UserCardSkeleton></UserCardSkeleton>}
					{!isPending && user && <UserCard user={user} />}
					{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

const UserCard = ({ user }: { user: User }) => {
	const [isPending, setIsPending] = useState(false);
	const [result, setResult] = useState<{ success: boolean; message: string }>({ success: false, message: "" });
	return (
		<>
			<div className="rounded-lg h-15 px-2.5  bg-accent/30 flex items-center gap-2.5">
				<div className="h-full flex items-center flex-row py-2.5">
					<Avatar
						disableTooltip={true}
						id={user.id}
						src={user.image}
						size="size-9"
						displayName={user.displayName}
						statusIndicator={false}
					/>
				</div>

				<div className="text-sm h-full flex flex-col justify-center flex-1 font-medium text-text truncate">
					<p>{user.displayName}</p>
					<p>@{user.username}</p>
				</div>

				<button
					disabled={isPending}
					onClick={async () => {
						setIsPending(true);
						const result = await createDM({ id: user.id, username: user.username });
						setResult({ success: result.success, message: result.message });
						setIsPending(false);
					}}
					className="hover:bg-background/75 btn-with-icon justify-center items-center gap-2"
				>
					Create DM
					{isPending && <BiLoaderAlt className="animate-spin text-lg" />}
				</button>
			</div>
			{result.success && <p className="mt-1 text-sm text-success">{result.message}</p>}
			{!result.success && <p className="mt-1 text-xs text-red-500">{result.message}</p>}
		</>
	);
};

export const UserCardSkeleton = () => {
	return (
		<div className="rounded-lg h-15 px-2.5 bg-accent/50 not-dark:bg-foreground/25 flex items-center gap-2.5 animate-pulse">
			{/* Avatar placeholder */}
			<div className="h-full flex items-center flex-row py-2.5">
				<div className="rounded-full bg-background/50 w-9 h-9"></div>
			</div>

			{/* Text placeholder */}
			<div className="flex-1 flex flex-col justify-center gap-1">
				<div className="h-3 w-1/2 bg-background/50 rounded"></div>
				<div className="h-3 w-1/3 bg-background/50 rounded"></div>
			</div>

			{/* Button placeholder */}
			<div className="w-20 h-8 bg-background/50 rounded"></div>
		</div>
	);
};
