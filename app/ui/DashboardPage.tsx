"use client";

import { signOut, useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Avatar } from "@/app/ui/general/Avatar";
import { Button } from "@/app/ui/general/Buttons";
import { User } from "../lib/definitions";
import React, { useRef, useState } from "react";
import { FaUser, FaIdBadge, FaEnvelope } from "react-icons/fa6";
import { editProfile, updateReadmeByUsername } from "../lib/actions";
import InputField from "./form/InputField";
import { ServerImageUploadBtn } from "./chat/components/UploadButtons";
import imageCompression from "browser-image-compression";
import TextareaAutosize from "react-textarea-autosize";
import { nanoid } from "nanoid";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { BiLoaderAlt } from "react-icons/bi";
import remarkGfm from "remark-gfm";
import rehypeReact from "rehype-react";
import { useToast } from "../lib/hooks/useToast";
import { normalizeMarkdown } from "../lib/utilities";
import { useRouterWithProgress } from "../lib/hooks/useRouterWithProgressBar";

type EditProfileState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
	user: User | null;
};

const DashboardPage = ({ initialUser, isOwnPage = true }: { initialUser: User; isOwnPage?: boolean }) => {
	const [user, setUser] = useState<User>(initialUser);
	const session = isOwnPage ? useSession() : null;
	const update = session?.update;
	const [isReadMeMode, setIsReadMeMode] = useState(false);

	const [{ errors, message, success }, setData] = useState<EditProfileState>({
		errors: {},
		message: "",
		success: false,
		user: null,
	});
	const [isPending, setIsPending] = useState(false);
	const router = useRouterWithProgress();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isOwnPage || !update) return;

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
				maxWidthOrHeight: 128,
				useWebWorker: true,
				fileType: "image/jpg",
			};

			const compressedFile = await imageCompression(selectedFile, options);

			const filename = `profile.jpg`;
			const filePath = `${user.id}/${filename}`;

			const { data, error } = await supabase.storage.from("uploads").upload(filePath, compressedFile, { upsert: true });
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
	const [isEditingReadme, setIsEditingReadme] = useState(false);
	const [readMeUpdatePending, setReadMeUpdatePending] = useState(false);
	const [readmeContent, setReadmeContent] = useState(
		user.readme?.trim() ||
			`# Hey there! I'm ${user.username} 👋

Looks like I haven't written my README yet. 

✨ Here’s what I might share:
- A little about me
- Projects I'm working on
- Fun facts or hobbies

Stay tuned for updates!`
	);

	const displayNameRef = useRef<HTMLInputElement | null>(null);
	const readmeRef = useRef<HTMLTextAreaElement | null>(null);
	const toast = useToast();
	const style = "prose max-w-full dark:prose-invert flex-1 border border-green-500";

	return (
		<section className="flex flex-1 w-full h-full min-h-0 break-words">
			{!isReadMeMode && (
				<div className="bg-contrast min-w-80 w-fit gap-4 flex flex-col pt-5 px-2 sm:px-4 max-w-90 max-md:max-w-full max-md:w-full">
					<div className="flex items-center gap-3">
						<Avatar
							disableTooltip
							src={user.image}
							displayName={user.displayName}
							size="size-[clamp(32px,15vw,64px)]"
							fontSize="text-[clamp(1em,5vw,1.5em)]"
							radius="rounded-full"
							statusIndicator={false}
						/>

						<div className="flex flex-col text-left -mt-1 flex-1 min-w-0">
							<h1 className="text-xl font-semibold text-text break-words leading-tight">{user.displayName} </h1>
							<p className="text-muted text-sm truncate mt-1">@{user.username}</p>
						</div>
					</div>

					<div className="w-full bg-surface-variant rounded-xl p-1 flex flex-col gap-4">
						<div className="flex justify-between items-center gap-4">
							<span className="text-muted font-medium">Email - </span>
							<span className="text-text break-words">{user.email}</span>
						</div>

						<div className="flex justify-between items-center gap-4">
							<span className="text-muted font-medium">Joined - </span>
							<span className="text-text">{new Date(user.createdAt as string).toLocaleDateString()}</span>
						</div>

						{user.bio && (
							<>
								<hr className="hr-separator mt-2 mb-0" />
								<div className="flex flex-1 flex-col gap-1  ">
									<p className="text-text whitespace-pre-line break-words">{user.bio}</p>
								</div>
							</>
						)}
					</div>

					{/* Action Buttons with Radix Dialog */}
					<div className="flex gap-2 mt-4 flex-wrap">
						{isOwnPage && (
							<>
								<Dialog.Root
									onOpenChange={(open) => {
										if (open) {
											setTimeout(() => {
												displayNameRef.current?.focus();
											}, 0); // wait for input to mount
										}
									}}
								>
									<Dialog.Trigger asChild>
										<Button className="btn-secondary w-full max-w-58 flex-1 btn-secondary-border">Edit Profile</Button>
									</Dialog.Trigger>

									<Dialog.Portal>
										<Dialog.Overlay className="fixed inset-0 bg-black/50" />
										<Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-xl p-6 w-full max-w-md shadow-lg border border-border">
											<Dialog.Title className="text-xl font-semibold text-text mb-4">Edit Profile</Dialog.Title>

											<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
												<ServerImageUploadBtn
													uploaded={uploaded}
													setUploaded={setUploaded}
													setSelectedFile={setSelectedFile}
													publicImgUrl={publicImgUrl}
												></ServerImageUploadBtn>

												{/* Display Name */}
												<InputField
													ref={displayNameRef}
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

												<fieldset>
													<label htmlFor="bio" className="flex flex-col gap-1 font-medium text-muted">
														<span className={`text-text font-semibold`}>Bio</span>
														<TextareaAutosize
															name="bio"
															minRows={3}
															maxRows={4}
															maxLength={160}
															placeholder="Enter your bio..."
															defaultValue={user.bio ?? ""}
															className="form-textarea
																rounded-lg
																!border-0
																border-border/65
																bg-background
																dark:bg-background/45
															placeholder-muted
																text-text
																transition
																text-base
																!outline-0
																!outline-none
																outline-transparent
		"
														/>

														{errors?.bio?.length !== 0 &&
															!success &&
															errors?.bio?.map((error) => (
																<p className="my-0.5 text-sm text-red-500" key={error}>
																	{error}
																</p>
															))}
													</label>
												</fieldset>

												{message && (
													<span className={clsx("text-sm my-1 ", success ? "text-success" : "text-error")}>
														{message}
													</span>
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
														{isPending && <BiLoaderAlt className="animate-spin text-lg" />}
													</Button>
												</div>
											</form>
										</Dialog.Content>
									</Dialog.Portal>
								</Dialog.Root>

								<Button
									className="btn-secondary btn-secondary-border"
									onClick={() => signOut({ callbackUrl: "/login" })}
								>
									Log Out
								</Button>
							</>
						)}
						<Button className="md:hidden btn-inverted !border-border" onClick={() => setIsReadMeMode(true)}>
							Open README.md
						</Button>
					</div>
				</div>
			)}
			<div
				className={clsx(
					"w-full h-full readme-container border-contrast border border-t-0 pb-3 pt-2 flex flex-col flex-1 min-h-0 min-w-0",
					!isReadMeMode && "max-md:hidden",
					style
				)}
			>
				<p className="text-muted text-sm mb-0 px-4">{user.username} / README.md</p>
				<hr className="hr-separator mt-2 mb-4 border-contrast" />

				{!isEditingReadme && (
					<>
						{readmeContent.trim() !== "" && (
							<div className="flex-1 min-h-0 min-w-0 overflow-y-auto pb-15 pl-6 max-sm:pl-4">
								<div className="prose dark:prose-invert w-full max-w-none pr-1 text-sm">
									<ReactMarkdown remarkPlugins={[remarkGfm, rehypeReact]}>{readmeContent}</ReactMarkdown>
								</div>
							</div>
						)}
						{readmeContent.trim() === "" && (
							<div className="flex-1 min-h-0 min-w-0 overflow-y-auto pb-15 pl-6 max-sm:pl-4 flex items-center justify-center ">
								<div className="prose dark:prose-invert w-full max-w-none text-center pr-1text-sm">
									<ReactMarkdown remarkPlugins={[remarkGfm, rehypeReact]}>{readmeContent}</ReactMarkdown>
								</div>
							</div>
						)}

						{isOwnPage && (
							<>
								<hr
									className="hr-separator
						border-contrast 
						!my-0
						"
								></hr>
								<div className="flex items-center gap-2 mt-3 px-4">
									<Button
										className="btn-secondary btn-secondary-border !border-border"
										onClick={() => {
											setIsEditingReadme(true);
											setTimeout(() => {
												readmeRef.current?.focus();
											}, 0);
										}}
									>
										Edit README.md
									</Button>
									{isReadMeMode && (
										<Button className="btn-primary" onClick={() => setIsReadMeMode(false)}>
											Close README.md
										</Button>
									)}
								</div>
							</>
						)}
					</>
				)}

				{isEditingReadme && (
					<form
						className="px-4"
						onSubmit={async (e) => {
							e.preventDefault();
							setReadMeUpdatePending(true);

							try {
								if (normalizeMarkdown(readmeContent) === normalizeMarkdown(user.readme || "")) {
									toast({ title: "Nothing changed in your README.md", subtitle: "", mode: "positive" });
									setReadMeUpdatePending(false);
									setIsEditingReadme(false);
									return;
								}

								const res = await updateReadmeByUsername(readmeContent);
								if (!res.success) {
									toast({ title: res.message, subtitle: "", mode: "negative" });
									return;
								}
								toast({ title: res.message, subtitle: "", mode: "positive" });
							} catch (err) {
								console.error(err);
								toast({ title: "Something went wrong. Please try again.", subtitle: "", mode: "negative" });
							} finally {
								setReadMeUpdatePending(false);
								setIsEditingReadme(false);
							}
						}}
					>
						{/* <textarea className="form-textarea w-full h-64 p-2 border rounded-lg bg-background text-text" /> */}
						<TextareaAutosize
							name="bio"
							disabled={readMeUpdatePending}
							ref={readmeRef}
							minRows={20}
							maxRows={20}
							value={readmeContent}
							onChange={(e) => setReadmeContent(e.target.value)}
							className="form-textarea
							w-full p-2 border
							rounded-lg
							bg-background
							dark:bg-background/45
						placeholder-muted
							text-text
							transition
							text-base
							!outline-0
							!outline-none
							outline-transparent
							!overflow-y-auto
							disabled:!pointer-events-none
		"
						/>

						<div className="flex gap-2 mt-2">
							<Button
								disabled={readMeUpdatePending}
								type="submit"
								className="btn-purple btn-with-icon disabled:pointer-events-none"
							>
								{readMeUpdatePending ? "Saving" : "Save"}
								{readMeUpdatePending && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
							</Button>
							<Button type="button" className="btn-secondary" onClick={() => setIsEditingReadme(false)}>
								Cancel
							</Button>
						</div>
					</form>
				)}
			</div>
		</section>
	);
};

export default DashboardPage;
