"use client";
import React, { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoMdClose, IoMdGlobe, IoMdPeople } from "react-icons/io";
import { FiPlus } from "react-icons/fi";
import { createServer, joinServer } from "@/app/lib/actions";
import * as Tabs from "@radix-ui/react-tabs";
import InputField from "./InputField";
import { IconWithSVG } from "../general/Buttons";
import { MdArrowForwardIos } from "react-icons/md";
import { GrPaint } from "react-icons/gr";
import { RiCompass3Fill } from "react-icons/ri";
import { Tooltip } from "react-tooltip";

import { MdMotionPhotosOn } from "react-icons/md";
import { User } from "@/app/lib/definitions";
import { RiLinksFill } from "react-icons/ri";
import Link from "next/link";
import { ServerImageUploadBtn } from "../chat/components/UploadButtons";
import clsx from "clsx";
import { MdMotionPhotosOff } from "react-icons/md";
import useToggle from "../../lib/hooks/useToggle";
import { supabase } from "@/app/lib/supabase";
import imageCompression from "browser-image-compression";
import { BiLoaderAlt } from "react-icons/bi";
import { useRouterWithProgress } from "@/app/lib/hooks/useRouterWithProgressBar";

type FormState = {
	errors: Record<string, string[]>;
	message: string;
	success: boolean;
};

export default function CreateServerFormDialog({ className, user }: { className: string; user: User }) {
	const [open, setOpen] = useState(false);
	const create_formRef = useRef<HTMLFormElement | null>(null);
	const join_formRef = useRef<HTMLFormElement | null>(null);

	const [{ errors, message, success }, setResult] = useState<FormState>({
		errors: {},
		message: "",
		success: false,
	});

	const [isPendingCreate, setIsPendingCreate] = useState(false);
	const [isPendingJoin, setIsPendingJoin] = useState(false);
	const router = useRouterWithProgress();

	const [uploaded, setUploaded] = useState<string>("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [publicImgUrl, setPublicImgUrl] = useState("");
	const createFormHandleSubmit = async (e: any) => {
		e.preventDefault();
		setIsPendingCreate(true);
		const form = create_formRef.current;
		const formData = new FormData(form!);
		const url = await uploadAndGetURL(formData.get("server_name"));
		if (!url) {
			alert("Upload required! (Fill out the form correctly)");
			setIsPendingCreate(false);
			return;
		}
		formData.set("server_image", url);
		const data = await createServer(formData);
		if (data.success) {
			router.refresh();
		}
		setResult(data);
		setIsPendingCreate(false);
		setOpen(false);
		form?.reset();
	};

	const joinFormHandleSubmit = async (e: any) => {
		e.preventDefault();

		setIsPendingJoin(true);

		const form = join_formRef.current;
		const formData = new FormData(form!);
		const inviteLink = String(formData.get("invite_link"));
		if (!inviteLink) {
			alert("Invite link required! (Fill out the form correctly)");
			setIsPendingJoin(false);
			return;
		}

		const regex = /^@\/invite\/([^/]+)$/;
		const match = inviteLink.match(regex);
		const id = match ? match[1] : null;

		if (!id) {
			alert("Invalid invite link! (Fill out the form correctly)");
			setIsPendingJoin(false);
			return;
		}

		await joinServer(id);
		setIsPendingJoin(false);
		setOpen(false);
		form?.reset();

		console.log("JOINED SERVER SUCCESS");
	};

	async function uploadAndGetURL(name: FormDataEntryValue | null) {
		const server_name = name?.toString().trim();
		if (!server_name) {
			alert("Please fill out the form!");
			return publicImgUrl;
		}

		if (selectedFile === null) {
			alert("Please select a file first.");
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
			const filePath = `${server_name}/${filename}`;

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

	const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const [style, setStyle] = useState({ width: "fit", height: "245.5px" });
	const tabOrder = ["default", "choose-type", "create", "join"];
	const [activeTab, setActiveTab] = useState("default");
	const [direction, setDirection] = useState<"forward" | "backward">("forward");
	const [serverType, setServerType] = useState<"public" | "private">("private");

	const handleTabChange = (value: string) => {
		const prevIndex = tabOrder.indexOf(activeTab);
		const newIndex = tabOrder.indexOf(value);

		setDirection(newIndex > prevIndex ? "forward" : "backward");
		setActiveTab(value);

		const el = tabRefs.current[value];
		if (el) {
			setStyle({
				width: `${el.offsetWidth}px`,
				height: `${el.offsetHeight}px`,
			});
		}
	};

	useEffect(() => {
		const el = tabRefs.current[activeTab];
		if (el) {
			setStyle({
				width: `${el.offsetWidth}px`,
				height: `${el.offsetHeight}px`,
			});
		}
	}, [errors, message]);

	useEffect(() => {
		if (!open) {
			setActiveTab("default");
			setStyle({ width: "fit", height: "245.5px" });
		}
	}, [open]);

	const [disableMotion, toggleDisableMotion] = useToggle(true);

	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	if (!mounted)
		return (
			<>
				<div className="icon-add_server w-full h-full">
					<FiPlus className={` ${className}`} />
				</div>
			</>
		);

	return (
		<Dialog.Root open={open} onOpenChange={setOpen}>
			<Dialog.Trigger asChild>
				<div className="icon-add_server w-full h-full">
					<FiPlus className={` ${className}`} />
				</div>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000]" />
				<Dialog.Content
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-119  max-h-[95vh] 
				bg-surface text-text rounded-2xl px-5 py-4 pt-7.5 shadow-lg shadow-black/95 not-dark:shadow-black/25
				animate-in fade-in-0 zoom-in-95 z-[12000] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
				>
					<div className="!absolute top-3 right-3 z-[100] flex gap-2">
						<IconWithSVG
							tabIndex={-1}
							onClick={toggleDisableMotion}
							data-tooltip-id="disable-motion-tooltip"
							data-tooltip-content={!disableMotion ? "Disable animations" : "Turn on animations"}
							className="btn-secondary icon-small"
							aria-label="Close"
						>
							{disableMotion && <MdMotionPhotosOff className="text-xl" />}
							{!disableMotion && <MdMotionPhotosOn className="text-xl" />}
						</IconWithSVG>
						<Tooltip className="my-tooltip" border="var(--tooltip-border)" id="disable-motion-tooltip"></Tooltip>
						<Dialog.Close asChild>
							<IconWithSVG className="btn-secondary icon-small" aria-label="Close">
								<IoMdClose className="text-xl" />
							</IconWithSVG>
						</Dialog.Close>
					</div>

					<Tabs.Root
						value={activeTab}
						onValueChange={handleTabChange}
						className="relative overflow-hidden"
						style={style}
					>
						{/* default */}

						<Tabs.Content
							data-direction={direction}
							forceMount
							ref={(el) => {
								tabRefs.current["default"] = el;
							}}
							className={clsx(
								"create-server-TabsContent transition-opacity duration-150",
								disableMotion && "!animate-none transition-none",
								activeTab === "default" ? "opacity-100" : "opacity-0"
							)}
							value="default"
						>
							<div className="mb-6 flex-col flex gap-3">
								<Dialog.Title className="create-server-dialog__title">Create Your Server</Dialog.Title>
								<Dialog.Description className="create-server-dialog__description">
									Your server is where your friends hang out. Make yours and start talking.
								</Dialog.Description>
							</div>
							<Tabs.List className="flex flex-col gap-2">
								<Tabs.Trigger asChild value="choose-type">
									<button className="btn btn-secondary w-full text-base py-3 px-4 text-left btn-with-icon border border-foreground/10">
										<GrPaint></GrPaint> Create my Own
										<MdArrowForwardIos className="ml-auto"></MdArrowForwardIos>
									</button>
								</Tabs.Trigger>
								{/* <p className="create-server-dialog__title text-base">Have an invite already?</p> */}
								<Tabs.Trigger asChild value="join">
									<button className="btn btn-secondary w-full text-base py-3 px-4 text-left btn-with-icon border border-foreground/10">
										<RiLinksFill></RiLinksFill>
										Join a server
										<MdArrowForwardIos className="ml-auto"></MdArrowForwardIos>
									</button>
								</Tabs.Trigger>
							</Tabs.List>
						</Tabs.Content>

						{/* choose type */}

						<Tabs.Content
							data-direction={direction}
							forceMount
							ref={(el) => {
								tabRefs.current["choose-type"] = el;
							}}
							className={clsx(
								"opacity-0 create-server-TabsContent transition-opacity duration-150",
								disableMotion && "!animate-none transition-none",
								activeTab === "choose-type" ? "opacity-100" : "opacity-0"
							)}
							value="choose-type"
						>
							<div className="mb-6 flex-col flex gap-3 mt-4">
								<Dialog.Title className="create-server-dialog__title">Tell Us More About Your Server</Dialog.Title>
								<Dialog.Description className="create-server-dialog__description">
									In order to help you with your setup, is your new server for just a few friends or a larger community?
								</Dialog.Description>
							</div>

							<Tabs.List className="flex flex-col gap-2">
								<Tabs.Trigger asChild value="create">
									<button
										onClick={() => setServerType("public")}
										className="btn btn-secondary w-full text-base py-3 px-4 text-left btn-with-icon border border-foreground/10"
									>
										<IoMdGlobe /> For a club or community
										<MdArrowForwardIos className="ml-auto" />
									</button>
								</Tabs.Trigger>

								<Tabs.Trigger asChild value="create">
									<button
										onClick={() => setServerType("private")}
										className="btn btn-secondary w-full text-base py-3 px-4 text-left btn-with-icon border border-foreground/10"
									>
										<IoMdPeople /> For me and my friends
										<MdArrowForwardIos className="ml-auto" />
									</button>
								</Tabs.Trigger>
							</Tabs.List>

							<Tabs.List className="flex flex-col gap-2 mt-5">
								<p className="text-muted text-center text-sm">
									Not sure? You can{" "}
									<Tabs.Trigger asChild value="create-friends">
										<span className="text-primary hover:underline cursor-pointer">skip this question</span>
									</Tabs.Trigger>{" "}
									for now.
								</p>
							</Tabs.List>

							<div className="flex justify-start gap-3 mt-5">
								<Tabs.List>
									<Tabs.Trigger value="default" asChild>
										<button type="button" className="btn btn-secondary">
											Back
										</button>
									</Tabs.Trigger>
								</Tabs.List>
							</div>
						</Tabs.Content>
						{/* join */}

						{/* TODO: implement tiny URLS api to shorten chat room */}

						<Tabs.Content
							data-direction={direction}
							forceMount
							ref={(el) => {
								tabRefs.current["join"] = el;
							}}
							className={clsx(
								"opacity-0 create-server-TabsContent transition-opacity duration-150",
								disableMotion && "!animate-none transition-none",
								activeTab === "join" ? "opacity-100" : "opacity-0"
							)}
							value="join"
						>
							<form ref={join_formRef} onSubmit={joinFormHandleSubmit}>
								<div className="mb-6 flex-col flex gap-3">
									<Dialog.Title className="create-server-dialog__title">Join a Server</Dialog.Title>
									<Dialog.Description className="create-server-dialog__description">
										Enter a invite link below to join an existing server
									</Dialog.Description>
								</div>

								<div className="px-1">
									<InputField
										name="invite_link"
										labelClassName="!text-muted"
										label={
											<>
												<span>Invite Link</span>
												<span className="text-xl ml-0.5 -mt-0.5 text-error/75">*</span>
											</>
										}
										placeholder="e.g. @/invite/abcdef123456"
									></InputField>
								</div>

								<Dialog.Close asChild>
									<Link
										href={"/discover"}
										className="no-underline decoration-0 btn btn-secondary w-full text-base py-3 px-3 text-left btn-with-icon border border-foreground/10 gap-2.5 my-5"
									>
										<div className="flex items-center justify-center rounded-full bg-primary shrink-0 p-1.5">
											<RiCompass3Fill className="text-3xl text-white" />
										</div>
										<div className="flex flex-col">
											<p className="text-[15px] font-semibold">Don't have an invite?</p>
											<p className="text-[13px] text-muted">Check out other communities in Server Discovery.</p>
										</div>
										<MdArrowForwardIos className="ml-auto shrink-0" />
									</Link>
								</Dialog.Close>

								<div className="flex justify-end gap-3 mt-4">
									<Tabs.List>
										<Tabs.Trigger value="default" asChild>
											<button type="button" className="btn btn-secondary">
												Back
											</button>
										</Tabs.Trigger>
									</Tabs.List>
									<button
										disabled={isPendingJoin}
										type="submit"
										// onClick={joinFormHandleSubmit}
										className="btn btn-primary btn-with-icon disabled:pointer-events-none"
									>
										{isPendingJoin ? "Joining" : "Join Server"}
										{isPendingJoin && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
									</button>
								</div>
							</form>
						</Tabs.Content>

						{/* create-club  OR create-club */}
						<Tabs.Content
							data-direction={direction}
							forceMount
							ref={(el) => {
								tabRefs.current["create"] = el;
							}}
							className={clsx(
								"opacity-0 create-server-TabsContent transition-opacity duration-150",
								disableMotion && "!animate-none transition-none",
								activeTab === "create" ? "opacity-100" : "opacity-0"
							)}
							value="create"
						>
							<div className="mb-6 flex-col flex gap-3">
								<Dialog.Title className="create-server-dialog__title">Customize Your Server</Dialog.Title>
								<Dialog.Description className="create-server-dialog__description">
									Give your new server a personality with a name and an icon. You can always change it later.
								</Dialog.Description>
							</div>

							<form
								aria-disabled={isPendingCreate}
								ref={create_formRef}
								onSubmit={createFormHandleSubmit}
								className="flex flex-col gap-2"
							>
								<ServerImageUploadBtn
									uploaded={uploaded}
									setUploaded={setUploaded}
									publicImgUrl={publicImgUrl}
									setSelectedFile={setSelectedFile}
								></ServerImageUploadBtn>

								<div className="px-1">
									<InputField
										placeholder="Recommended max: 16 characters"
										disabled={isPendingCreate}
										label="Server Name"
										name="server_name"
										success={success ? message : ""}
										errors={errors?.server_name}
									></InputField>
								</div>

								<input disabled={isPendingCreate} type="hidden" name="visibility" value={serverType} readOnly />

								<span className="my-0.5 text-xs text-muted">
									By creating a server, you agree to{" "}
									<Link href={`/`} className="font-semibold">
										NextChat's community guidelines
									</Link>
								</span>
								<div className="flex justify-end gap-3 mt-4">
									<Tabs.List>
										<Tabs.Trigger value="choose-type" asChild>
											<button type="button" className="btn btn-secondary">
												Back
											</button>
										</Tabs.Trigger>
									</Tabs.List>
									<button
										disabled={isPendingCreate}
										type="submit"
										onClick={createFormHandleSubmit}
										className="btn btn-primary btn-with-icon disabled:pointer-events-none"
									>
										{isPendingCreate ? "Creating" : "Create Server"}
										{isPendingCreate && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
									</button>
								</div>
							</form>
						</Tabs.Content>
					</Tabs.Root>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
