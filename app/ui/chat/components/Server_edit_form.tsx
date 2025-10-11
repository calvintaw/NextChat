"use client";

import { editServer, deleteServer } from "@/app/lib/actions";
import { Room } from "@/app/lib/definitions";
import { supabase } from "@/app/lib/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { nanoid } from "nanoid";
import { User } from "@/app/lib/definitions";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FiEdit } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { RiDeleteBin5Line } from "react-icons/ri";
import InputField from "../../form/InputField";
import { IconWithSVG, Button } from "../../general/Buttons";
import imageCompression from "browser-image-compression";
import { ServerImageUploadBtn } from "./UploadButtons";
import { BiLoaderAlt } from "react-icons/bi";
import { useRouterWithProgress } from "@/app/lib/hooks/useRouterWithProgressBar";

type EditServerState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
	server: Room | null;
};

export function ServerEditForm({
	server,
	user,
	setLocalServer,
}: {
	server: Room;
	user: User;
	setLocalServer: React.Dispatch<React.SetStateAction<Room>>;
}) {
	const [uploaded, setUploaded] = useState<string>(server.profile ?? "");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [publicImgUrl] = useState<string>(server.profile ?? "");
	useEffect(() => {
		if (selectedFile) {
			console.log(selectedFile);
		}
	}, [selectedFile]);
	const [{ errors, message, success }, setData] = useState<EditServerState>({
		errors: {},
		message: "",
		success: false,
		server: null,
	});
	const [isPending, setIsPending] = useState(false);
	const router = useRouterWithProgress();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsPending(true);
		const formData = new FormData(e.target as HTMLFormElement);
		const url = await uploadAndGetURL();
		console.log("server_image: CHATBOX: ", url);
		formData.set("server_image", url);
		const result = await editServer(formData, server, user.id);
		setData(result);
		if (result.server) setLocalServer((prev) => ({ ...prev, ...result.server }));
		setIsPending(false);
		router.refresh();
	}

	async function uploadAndGetURL(): Promise<string> {
		console.log("uploadAndGetURL called");
		console.log("selectedFile:", selectedFile);
		console.log("publicImgUrl:", publicImgUrl);

		if (selectedFile === null) {
			console.log("No selected file, returning publicImgUrl:", publicImgUrl);
			return publicImgUrl;
		}

		try {
			const options = {
				maxSizeMB: 0.2,
				maxWidthOrHeight: 128,
				useWebWorker: true,
				fileType: "image/jpg",
			};

			const compressedFile = await imageCompression(selectedFile, options);
			const filename = `profile.jpg`;
			const filePath = `${server.name}/${filename}`;
			const { data, error } = await supabase.storage.from("uploads").upload(filePath, compressedFile, { upsert: true });
			if (error) throw error;

			const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(data?.path || "");

			if (publicData?.publicUrl) {
				return publicData.publicUrl;
			}

			console.log("No public URL, resetting uploaded");
			setUploaded("");
			return "";
		} catch (err) {
			console.error("Upload error caught:", err);
			return "";
		}
	}

	return (
		<div className="flex items-center gap-1 text-gray-400 text-sm">
			<IconWithSVG
				onClick={() => {
					const isConfirmed = window.confirm("Are you sure you want to delete this server?");
					if (isConfirmed) deleteServer(server.id);
				}}
				className="icon-small"
			>
				<RiDeleteBin5Line />
			</IconWithSVG>

			<Dialog.Root>
				<Dialog.Trigger asChild>
					<IconWithSVG className="icon-small">
						<FiEdit />
					</IconWithSVG>
				</Dialog.Trigger>

				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black/50" />
					<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-md shadow-lg border border-border">
						<Dialog.Title className="text-xl font-semibold text-text mb-4">Edit Server</Dialog.Title>

						{/* Server Edit Form */}
						<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
							{/* Server Icon / Profile Image */}
							<ServerImageUploadBtn
								uploaded={uploaded}
								setUploaded={setUploaded}
								setSelectedFile={setSelectedFile}
								publicImgUrl={publicImgUrl}
							/>

							{/* Server Name */}
							<InputField
								label="Server Name"
								name="name"
								defaultValue={server.name}
								placeholder="Enter server name"
								errors={errors?.name}
							/>

							{/* Server Description */}
							<InputField
								label="Server Description"
								name="description"
								defaultValue={server.description || ""}
								placeholder="Enter a short description (optional)"
								errors={errors?.description}
							/>

							{/* Server Type / Visibility */}
							<div className="flex flex-col gap-1">
								<span className="text-muted text-sm">Server Type</span>
								<select
									name="type"
									defaultValue={server.type}
									className="form-select

                  !w-full
                  !flex
                  !items-center
                  !relative
                  !px-3
                  !min-h-11
                  !outline-none
                  !rounded-lg
                  !border
                  !border-border
                  !bg-background
                  !text-text
                  !placeholder-muted
                  !transition
                  !text-base
                  !focus-within:!border-primary

                "
								>
									<option value="private">Private (invite-only)</option>
									<option value="public">Public (anyone can join)</option>
								</select>
								{errors?.type && <span className="text-error text-xs">{errors.type}</span>}
							</div>

							{message && <span className={clsx("text-sm", success ? "text-success" : "text-error")}>{message}</span>}

							{/* Action Buttons */}
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
									{isPending && <BiLoaderAlt className="animate-spin text-lg" />}
								</Button>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}
