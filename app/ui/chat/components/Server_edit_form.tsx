"use client";

import { editServer, deleteServer } from "@/app/lib/actions";
import { Room } from "@/app/lib/definitions";
import { supabase } from "@/app/lib/supabase";
import * as Dialog from "@radix-ui/react-dialog";
import clsx from "clsx";
import { nanoid } from "nanoid";
import { User } from "@/app/lib/definitions";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FiEdit } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import { RiDeleteBin5Line } from "react-icons/ri";
import InputField from "../../form/InputField";
import { IconWithSVG, Button } from "../../general/Buttons";
import imageCompression from "browser-image-compression";
import { ServerBannerUploadBtn, ServerImageUploadBtn } from "./UploadButtons";
import { BiLoaderAlt } from "react-icons/bi";
import { useRouterWithProgress } from "@/app/lib/hooks/useRouterWithProgressBar";
import { IoMdSettings } from "react-icons/io";
import { Tooltip } from "react-tooltip";

type EditServerState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
	server: Room | null;
	state: "idle" | "pending" | "success" | "error" | "no-changes";
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
	const [IsBannerUploaded, setIsBannerUploaded] = useState<string>(server.banner ?? "");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
	const [publicImgUrl] = useState<string>(server.profile ?? "");
	const [publicBannerImgUrl] = useState<string>(server.banner ?? "");
	const dialogRef = useRef<HTMLElement | null>(null);
	const [isOpen, setIsOpen] = useState(false);

	const [{ errors, message, success, ...data }, setData] = useState<EditServerState>({
		errors: {},
		message: "",
		success: false,
		server: null,
		state: "idle",
	});
	const router = useRouterWithProgress();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setData((prev) => ({ ...prev, state: "pending" }));

		const formData = new FormData(e.target as HTMLFormElement);
		const name = formData.get("name")?.toString().trim() || "";
		const description = formData.get("description")?.toString().trim() || "";
		const type = formData.get("type")?.toString() || "";

		// Check if nothing changed
		const noChanges =
			name === server.name &&
			description === (server.description || "") &&
			type === server.type &&
			!selectedFile &&
			!selectedBannerFile;

		if (noChanges) {
			setData({
				errors: {},
				message: "No changes made.",
				success: false,
				server: null,
				state: "no-changes",
			});
			return; // Stop submission
		}

		setData((prev) => ({ ...prev, state: "pending" }));
		const profileUrl = await uploadAndGetURL();
		formData.set("server_image", profileUrl);

		const bannerUrl = await uploadAndGetURL_Banner();
		formData.set("server_banner", bannerUrl);

		const result = await editServer(formData, server, user.id);
		setData({ ...result, state: result.success ? "success" : "error" });

		if (result.server) {
			setLocalServer((prev) => ({ ...prev, ...result.server }));
		}
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

	async function uploadAndGetURL_Banner(): Promise<string> {
		console.log("uploadAndGetURL called");
		console.log("selectedFile:", selectedBannerFile);
		console.log("publicImgUrl:", publicBannerImgUrl);

		if (selectedBannerFile === null) {
			console.log("No selected file, returning publicImgUrl:", publicBannerImgUrl);
			return publicBannerImgUrl;
		}

		try {
			const bannerOptions = {
				maxSizeMB: 0.15,
				maxWidthOrHeight: 800,
				useWebWorker: true,
				fileType: "image/jpg",
				initialQuality: 0.75,
			};

			const compressedFile = await imageCompression(selectedBannerFile, bannerOptions);
			const filename = `profile.jpg`;
			const filePath = `${server.name}/banner:${filename}`;
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

	function openCloseDialog(open: boolean) {
		setIsOpen(open);
		if (!open) {
			setData({
				errors: {},
				message: "",
				success: false,
				server: null,
				state: "idle",
			});
			setUploaded(server.profile ?? "");
			setIsBannerUploaded(server.banner ?? "");
			setSelectedFile(null);
			setSelectedBannerFile(null);
		}
	}

	return (
		<div className="flex items-center gap-1 text-gray-400 text-sm">
			{/* <IconWithSVG
				onClick={() => {
					const isConfirmed = window.confirm("Are you sure you want to delete this server?");
					if (isConfirmed) deleteServer(server.id);
				}}
				className="!size-6.5"
			></IconWithSVG> */}
			{/* <Tooltip
				id={`header-icons-tooltip-settings`}
				place="left-start"
				className="small-tooltip"
				border="var(--tooltip-border)"
				offset={0}
				
			/> */}

			<Dialog.Root open={isOpen} onOpenChange={openCloseDialog}>
				<Dialog.Trigger asChild>
					<IconWithSVG
						className="!size-7.5"
						data-tooltip-id="header-icons-tooltip"
						data-tooltip-content={"Server settings"}
					>
						<IoMdSettings className="text-lg" />
					</IconWithSVG>

					{/* <button className={"btn btn-small !w-fit p-1 px-1.5 btn-with-icon items-center flex gap-1.5 btn-secondary"}>
						<IoMdSettings className="text-lg" />
						Settings
					</button> */}
				</Dialog.Trigger>

				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
					<Dialog.Content
						className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 py-4 w-full max-w-md shadow-lg border border-border
z-[12000]					"
					>
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

							<ServerBannerUploadBtn
								uploaded={IsBannerUploaded}
								setUploaded={setIsBannerUploaded}
								setSelectedFile={setSelectedBannerFile}
								publicImgUrl={publicBannerImgUrl}
							/>

							{/* Server Name */}
							<InputField
								labelClassName="font-semibold text-sm text-text"
								label="Server Name"
								name="name"
								defaultValue={server.name}
								placeholder="Enter server name"
								errors={errors?.name}
								autoComplete="off"
							/>

							{/* Server Description */}
							<InputField
								labelClassName="font-semibold text-sm text-text"
								label="Server Description"
								name="description"
								defaultValue={server.description || ""}
								placeholder="Enter a short description (optional)"
								errors={errors?.description}
								autoComplete="off"
							/>

							{/* Server Type / Visibility */}
							<div className="flex flex-col gap-1">
								<span className=" font-semibold text-sm text-text">Server Type</span>
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
								!border-border/65
								!bg-background
									dark:!bg-background/45
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

							{message && (
								<span className={clsx("text-sm -mt-1 -mb-2", success ? "text-success" : "text-error")}>{message}</span>
							)}

							{/* Action Buttons */}
							<div className="flex justify-between gap-2 mt-2">
								<button
									type="button"
									onClick={() => {
										const isConfirmed = window.confirm(
											"Are you sure you want to delete this server? This will kick out everyone. "
										);
										if (isConfirmed) deleteServer(server.id);
									}}
									className={
										"btn bg-red-400 hover:bg-red-500 opacity-50 dark:bg-red-500 hover:opacity-100 !w-fit btn-with-icon items-center flex gap-1.5 btn-secondary"
									}
								>
									<RiDeleteBin5Line className="text-xl" />
									{/* <FiEdit className="text-lg" /> */}
									Delete Server
								</button>

								<div className="flex gap-2">
									<Dialog.Close asChild>
										<button className="btn btn-secondary">Cancel</button>
									</Dialog.Close>
									<Button
										disabled={data.state === "pending"}
										className="btn-purple btn-with-icon justify-center items-center gap-2"
										type={data.state === "error" || data.state === "idle" ? "submit" : "button"}
										onClick={(e) => {
											if (data.state === "success" || data.state === "no-changes") {
												e.preventDefault();
												openCloseDialog(false);
											}
											// if state is "error", just let the form submit normally
										}}
									>
										{data.state === "pending"
											? "Saving..."
											: data.state === "success"
											? "Close"
											: data.state === "error"
											? "Try again"
											: data.state === "no-changes"
											? "OK"
											: "Save Changes"}
										{data.state === "pending" && <BiLoaderAlt className="animate-spin text-lg" />}
									</Button>
								</div>
							</div>
						</form>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	);
}
