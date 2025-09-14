"use client";

import { signOut, useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Avatar } from "@/app/ui/general/Avatar";
import { Button } from "@/app/ui/general/Buttons";
import { User } from "../lib/definitions";
import React, { useEffect, useState } from "react";
import { FaUser, FaIdBadge, FaEnvelope } from "react-icons/fa6";
import { editProfile } from "../lib/actions";
import InputField from "./form/InputField";
import { ImSpinner9 } from "react-icons/im";
import { ServerImageUploadBtn } from "./chat/components/UploadButtons";
import imageCompression from "browser-image-compression";
import { nanoid } from "nanoid";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import clsx from "clsx";

type EditProfileState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
	user: User | null;
};

const DashboardPage = ({ initialUser }: { initialUser: User }) => {
	const [user, setUser] = useState<User>(initialUser);
	const { update } = useSession();

	const [{ errors, message, success }, setData] = useState<EditProfileState>({
		errors: {},
		message: "",
		success: false,
		user: null,
	});
	const [isPending, setIsPending] = useState(false);
	const router = useRouter();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsPending(true);
		const formData = new FormData(e.target as HTMLFormElement);
		const url = await uploadAndGetURL();
		formData.set("server_image", url);
		const result = await editProfile(user, formData);
		setData(result);
		if (result.user) setUser(result.user);
		setIsPending(false);
		await update({ ...user, ...result.user });
		router.refresh();
	}

	const [uploaded, setUploaded] = useState<string>(user.image);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [publicImgUrl] = useState<string>(user.image);

	async function uploadAndGetURL() {
		if (selectedFile === null) {
			return publicImgUrl;
		}

		try {
			const options = {
				maxSizeMB: 0.2,
				maxWidthOrHeight: 256,
				useWebWorker: true,
			};

			const compressedFile = await imageCompression(selectedFile, options);

			const filename = `${nanoid()}.${compressedFile.name.split(".").pop()}`;
			const { data, error } = await supabase.storage.from("uploads").upload(filename, compressedFile);
			if (error) throw error;

			const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(data?.path || "");

			if (publicData?.publicUrl) {
				return publicData.publicUrl;
			}

			setUploaded("");
			return "";
		} catch (err) {
			console.error("Upload error:", err);
			return "";
		}
	}

	return (
		<>
			<div className="bg-contrast flex-1 gap-4 flex flex-col pt-5 px-2 sm:px-4 max-w-89 border">
				<div className="flex justify-center items-center gap-4 ">
					<Avatar
						src={user.image}
						displayName={user.displayName}
						size="size-[clamp(3rem,8vw,5rem)]"
						fontSize="text-[clamp(1.25rem,4vw,1.75rem)]"
						radius="rounded-full"
						statusIndicator={false}
					/>

					<div className="flex flex-col text-left -mt-1">
						<h1 className="text-[clamp(1.25rem,4vw,1.75rem)] font-semibold text-text">{user.displayName}</h1>
						<p className="text-text text-sm">@{user.username}</p>
					</div>
				</div>

				<div className="min-w-xs w-full bg-surface-variant rounded-xl p-1 sm:p-6 flex flex-col gap-4">
					<div className="flex justify-between items-center gap-4">
						<span className="text-muted font-medium">Email</span>
						<span className="text-text break-words">{user.email}</span>
					</div>

					<div className="flex justify-between items-center gap-4">
						<span className="text-muted font-medium">Joined</span>
						<span className="text-text">{new Date(user.createdAt as string).toLocaleDateString()}</span>
					</div>
				</div>

				{/* Action Buttons with Radix Dialog */}
				<div className="flex gap-4 mt-4">
					<Dialog.Root>
						<Dialog.Trigger asChild>
							<Button className="btn-third">Edit Profile</Button>
						</Dialog.Trigger>

						<Dialog.Portal>
							<Dialog.Overlay className="fixed inset-0 bg-black/50" />
							<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-md shadow-lg border border-border">
								<Dialog.Title className="text-xl font-semibold text-text mb-4">Edit Profile</Dialog.Title>

								{/* Example form */}
								<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
									<ServerImageUploadBtn
										uploaded={uploaded}
										setUploaded={setUploaded}
										setSelectedFile={setSelectedFile}
										publicImgUrl={publicImgUrl}
									></ServerImageUploadBtn>

									{/* Display Name */}
									<InputField
										label="Display Name"
										name="displayName"
										icon={<FaUser />}
										defaultValue={user.displayName}
										errors={errors?.displayName}
									/>

									{/* Username */}
									<InputField
										label="Username"
										name="username"
										icon={<FaIdBadge />}
										defaultValue={user.username}
										errors={errors?.username}
									/>

									{/* Email */}
									<InputField
										label="Email"
										name="email"
										icon={<FaEnvelope />}
										type="email"
										errors={errors?.email}
										defaultValue={user.email}
									/>

									{message && (
										<span className={clsx("text-sm my-1 ", success ? "text-success" : "text-error")}>{message}</span>
									)}

									<div className="flex justify-end gap-2 mt-2">
										<Dialog.Close asChild>
											<Button className="btn-secondary">Cancel</Button>
										</Dialog.Close>
										<Button
											disabled={isPending}
											className="btn-purple btn-with-icon justify-center items-center gap-2"
											type="submit"
										>
											{isPending ? "Saving..." : "Save Changes"}
											{isPending && <ImSpinner9 className="animate-spin" />}
										</Button>
									</div>
								</form>
							</Dialog.Content>
						</Dialog.Portal>
					</Dialog.Root>

					<Button className="btn-secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
						Log Out
					</Button>
				</div>
			</div>
		</>
	);
};

export default DashboardPage;
