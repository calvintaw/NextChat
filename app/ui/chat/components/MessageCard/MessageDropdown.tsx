import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type Props = {
	msg: MessageType;
	retrySendingMessage: (msg: MessageType) => void;
};

export function MessageDropdownMenu({ msg, retrySendingMessage }: Props) {
	const [open, toggleOpen] = useToggle(false);
	const [copied, setCopied] = useState(false);
	const { setMsgToEdit, messages, setMessages, user, roomId, setReplyToMsg, deleteMessage } = useChatProvider();

	const toast = useToast();

	const toggleReaction = async (emoji: string) => {
		// const originalMsg = [...messages];
		let didChange = false; // track if reaction changed

		// local update
		setMessages((prev: MessageType[]) => {
			const index = prev.findIndex((tx) => tx.id === msg.id);
			if (index === -1) return prev;

			const newMsg = [...prev];

			// const currentReactors = new Set(newMsg[index].reactions?.[emoji] || []);
			// const hasReacted = currentReactors.has(user.id);

			// // if user already has the same emoji, then remove it (set didChange to false)
			// if (hasReacted) {
			// 	currentReactors.delete(user.id);
			// 	didChange = false; // user removed reaction

			// 	// else user already has the same emoji, then add it (set didChange to true)
			// } else {
			// 	currentReactors.add(user.id);
			// 	didChange = true; // user added reaction
			// }

			// newMsg[index] = {
			// 	...newMsg[index],
			// 	reactions: {
			// 		...newMsg[index].reactions,
			// 		[emoji]: [...currentReactors],
			// 	},
			// };
			const currentReactors = newMsg[index].reactions?.[emoji] || [];
			const hasReacted = currentReactors.includes(user.id);

			let updatedReactors;

			if (hasReacted) {
				// Remove user
				updatedReactors = currentReactors.filter((id) => id !== user.id);
				didChange = false; // user removed reaction
			} else {
				// Add user at the end
				updatedReactors = [...currentReactors, user.id];
				didChange = true; // user added reaction
			}

			newMsg[index] = {
				...newMsg[index],
				reactions: {
					...newMsg[index].reactions,
					[emoji]: updatedReactors,
				},
			};

			return newMsg;
		});

		const result = didChange
			? await addReactionToMSG({ id: msg.id, roomId, userId: user.id, emoji })
			: await removeReactionFromMSG({ id: msg.id, roomId, userId: user.id, emoji });
		if (!result.success) {
			// setMessages(originalMsg);
			toast({ title: "Error!", mode: "negative", subtitle: result.message });
		}
	};

	const handleCopy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 5000);
		} catch (err) {
			console.error("Failed to copy!", err);
		}
	};

	return (
		<div onClick={(e) => e.stopPropagation()}>
			<DropdownMenu.Root modal={false} open={open} onOpenChange={toggleOpen}>
				<div
					className={clsx(
						`
							hidden
							group-hover:!flex
							absolute bg-background dark:bg-surface z-40 -top-6.5 max-sm:right-5 right-30 rounded-lg border border-border/30 gap-1 items-center p-[0.2rem]
							`,
						open ? "!flex" : ""
					)}
				>
					{/* Emoji Reactions */}
					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Thumbs Up"
						className="icon-message-tooltip text-lg text-yellow-400"
						onClick={() => toggleReaction("👍")}
					>
						👍
					</IconWithSVG>

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Heart"
						className="icon-message-tooltip text-lg text-red-500"
						onClick={() => toggleReaction("❤️")}
					>
						❤️
					</IconWithSVG>

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Laugh"
						className="icon-message-tooltip text-lg text-yellow-300"
						onClick={() => toggleReaction("😃")}
					>
						😃
					</IconWithSVG>

					{msg.sender_id === user.id && msg.type !== "video-call" && msg.type !== "image" && (
						<IconWithSVG
							data-tooltip-id="icon-message-dropdown-menu-id"
							data-tooltip-content="Edit"
							className="icon-message-tooltip text-lg"
							onClick={() => {
								setMsgToEdit(msg.id);
								handleCopy(msg.id);
							}}
						>
							<FiEdit />
						</IconWithSVG>
					)}

					{msg.sender_id === user.id && msg.type === "image" && <EditImageDialog msg={msg} />}

					<IconWithSVG
						data-tooltip-id="icon-message-dropdown-menu-id"
						data-tooltip-content="Delete"
						className="icon-message-tooltip"
						onClick={() => deleteMessage(msg.id, msg.type, msg.content)}
					>
						<ImBin className="!text-[20px]" />
					</IconWithSVG>

					{typeof msg.synced === "boolean" && !msg.synced && (
						<IconWithSVG
							data-tooltip-id="icon-message-dropdown-menu-id"
							data-tooltip-content="Retry"
							onClick={() => retrySendingMessage(msg)}
							className="icon-message-tooltip min-sm:hidden"
						>
							<AiOutlineReload />
						</IconWithSVG>
					)}

					{msg.sender_id !== user.id && (
						<IconWithSVG
							data-tooltip-id="icon-message-dropdown-menu-id"
							data-tooltip-content="Reply"
							className="icon-message-tooltip text-lg"
							onClick={() => {
								setReplyToMsg(msg);
							}}
						>
							<HiReply />
						</IconWithSVG>
					)}

					{/* Dots / Menu Trigger */}
					<DropdownMenu.Trigger asChild>
						<IconWithSVG className="icon-message-tooltip data-[state=open]:bg-accent">
							<HiDotsHorizontal />
						</IconWithSVG>
					</DropdownMenu.Trigger>
				</div>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						loop
						side="left"
						sideOffset={8}
						align="start"
						collisionPadding={20}
						className="DropdownMenu__Content p-3 rounded-2xl"
					>
						{/* Emoji Reactions Row */}
						<DropdownMenu.Group className="flex items-center gap-1 mb-2">
							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("👍")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-400">👍</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("❤️")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-red-500">❤️</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("😃")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-300">😃</IconWithSVG>
							</DropdownMenu.Item>

							<DropdownMenu.Item
								onSelect={(e) => e.preventDefault()}
								onClick={() => toggleReaction("👎")}
								className="p-0 focus:outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-blue-500 rounded-lg"
							>
								<IconWithSVG className="text-2xl bg-accent/50 hover:bg-accent text-yellow-300">👎</IconWithSVG>
							</DropdownMenu.Item>
						</DropdownMenu.Group>

						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<IoIosArrowBack />
							Add Reaction
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaReply /> Reply
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaArrowRight /> Forward
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item
							onSelect={(e) => e.preventDefault()}
							className={`${copied && "text-success"} DropdownMenuItem gap-3`}
							onClick={() => handleCopy(msg.content)}
						>
							<FaCopy /> {!copied && <>Copy Text {"(Works)"}</>}
							{copied && "Copied Text"}
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaThumbtack /> Pin Message
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaLink /> Copy Message Link
						</DropdownMenu.Item>
						<DropdownMenu.Item className="DropdownMenuItem gap-3">
							<FaVolumeUp /> Speak Message
						</DropdownMenu.Item>

						<DropdownMenu.Separator className="DropdownMenu__Separator" />

						<DropdownMenu.Item
							onClick={() => deleteMessage(msg.id, msg.type, msg.content)}
							className="DropdownMenuItem data-[highlighted]:bg:error/20 text-error gap-3"
						>
							<ImBin className="text-lg" /> Delete Message {"(Works)"}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	);
}

const EditImageDialog = ({ msg }: { msg: MessageType }) => {
	const [uploaded, setUploaded] = useState<string[]>(JSON.parse(msg.content));
	const [removed, setRemoved] = useState<string[]>([]);
	const [compress, setCompress] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

	const { roomId, handleUpdateImageFromParent, setMessages } = useChatProvider();
	const [dialogOpen, setDialogOpen] = useState(false); // manually control dialog box Open State as UI has some special requirements

	function resetDefault() {
		setUploaded(JSON.parse(msg.content)); // reset to original
		setRemoved([]);
		setCompress(true);
		setIsUploading(false);
		setSelectedFiles([]);
		setDialogOpen(false);
	}

	useEffect(() => {
		setUploaded(JSON.parse(msg.content));
	}, [msg.content]);

	useEffect(() => {
		return () => {
			resetDefault();
		};
	}, []);

	const toast = useToast();
	
	const handleUpload = async () => {
		console.log("EditImageDialog MSG: ", msg);

		if (isUploading) {
			console.warn("❗Early return: Upload already in progress.");
			alert("Uploading File...");
			return;
		}

		setIsUploading(true);
		try {
			const options = {
				maxSizeMB: 0.45,
				maxWidthOrHeight: 600,
				useWebWorker: true,
				fileType: "image/jpg",
			};

			const originalFiles = JSON.parse(msg.content) as string[];
			const currentfilePaths = extractFilePath(originalFiles);

			const imgArray = [];

			for (let selectedFile of selectedFiles) {
				const type = selectedFile.type;

				const compressedFile =
					compress && type.startsWith("image/") ? await imageCompression(selectedFile, options) : selectedFile;

				const filename = `${nanoid()}.${compressedFile.name.split(".").pop()}`;
				const filePath = `${roomId}/${filename}`;

				if (currentfilePaths.includes(filePath)) {
					console.log(`Skipping file (already exists): ${filePath}`);
					imgArray.push(originalFiles[currentfilePaths.indexOf(filePath)]);
					continue;
				}

				const { data, error } = await supabase.storage.from("uploads").upload(filePath, compressedFile);

				if (error) throw error;

				const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(data?.path || "");

				if (publicData?.publicUrl && type.startsWith("image/")) {
					console.log(`Uploaded new file: ${publicData.publicUrl}`);
					imgArray.push(publicData.publicUrl);
				}
			}

			// if (imgArray.length > 0) {
			console.log("Attempting to delete removed images:", extractFilePath(removed));

			if (removed.length > 0) {
				const { error } = await supabase.storage.from("uploads").remove(extractFilePath(removed));

				if (error) {
					console.error("❗Early return: Failed deleting old image:", error.message);

					toast({
						title: "Error",
						subtitle: "Failed to delete the current Image. Please try again later!",
						mode: "negative",
					});

					return;
				}
			}

			// filter out removed ones
			const keptOriginals = originalFiles.filter((url) => !removed.includes(url));

			// merge kept originals + new uploads
			const finalArray = [...keptOriginals, ...imgArray];
			console.log("Updating image content in DB with:", finalArray);

			if (finalArray.length > 0) {
				await handleUpdateImageFromParent({
					content: JSON.stringify(finalArray),
					id: msg.id,
				});
			} else {
				await deleteMsg(msg.id, roomId, "text", "");
				setMessages((prev: MessageType[]) => prev.filter((c) => c.id !== msg.id));
			}
			// } else {
			// 	console.warn("❗Early return: imgArray is empty — no images to update.");
			// 	return;
			// }
		} catch (err) {
			console.error("Upload error:", err);
		} finally {
			console.log("Resetting upload state & closing dialog.");
			resetDefault();
		}
	};

	const removeFileUpload = async (index: number) => {
		setRemoved((prev) => [...prev, uploaded[index]]);
		setUploaded((prev) => prev.filter((src, i) => i !== index));
		setSelectedFiles((prev) => prev.filter((file, i) => i !== index));
	};

	return (
		<ImageUploadDialog
			isUploading={isUploading}
			uploaded={uploaded}
			removeFileUpload={removeFileUpload}
			compress={compress}
			setCompress={setCompress}
			selectedFiles={selectedFiles}
			setSelectedFiles={setSelectedFiles}
			setUploaded={setUploaded}
			handleUpload={handleUpload}
			setDialogOpen={setDialogOpen}
			dialogOpen={dialogOpen}
		/>
	);
};

import * as Dialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";
import { ChangeEvent, Dispatch, forwardRef, ReactNode, SetStateAction, useEffect, useRef, useState } from "react";
import { HiDotsHorizontal, HiOutlineX, HiReply } from "react-icons/hi";
import { supabase } from "@/app/lib/supabase";
import imageCompression from "browser-image-compression";
import { nanoid } from "nanoid";
import { GoPlus } from "react-icons/go";
import { extractFilePath } from "@/app/lib/utilities";
import { addReactionToMSG, removeReactionFromMSG, deleteMsg } from "@/app/lib/actions";
import { MessageType } from "@/app/lib/definitions";
import { useToast } from "@/app/lib/hooks/useToast";
import useToggle from "@/app/lib/hooks/useToggle";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import clsx from "clsx";
import { AiOutlineReload } from "react-icons/ai";
import { FaReply, FaArrowRight, FaCopy, FaThumbtack, FaLink, FaVolumeUp } from "react-icons/fa";
import { FiEdit, FiCamera } from "react-icons/fi";
import { ImBin } from "react-icons/im";
import { IoIosArrowBack } from "react-icons/io";
import { useChatProvider } from "../../ChatBoxWrapper";

export interface ImageUploadDialogProps {
	isUploading: boolean;
	uploaded: string[];
	setUploaded: Dispatch<SetStateAction<string[]>>;
	removeFileUpload: (index: number) => void;
	compress: boolean;
	setCompress: Dispatch<SetStateAction<boolean>>;
	selectedFiles: File[];
	setSelectedFiles: Dispatch<SetStateAction<File[]>>;
	handleUpload: () => void;
	dialogOpen: boolean;
	setDialogOpen: Dispatch<SetStateAction<boolean>>;
}

const ImageUploadDialog = ({
	isUploading,
	uploaded,
	removeFileUpload,
	compress,
	setCompress,
	selectedFiles,
	setSelectedFiles,
	setUploaded,
	dialogOpen,
	setDialogOpen,
	handleUpload,
}: ImageUploadDialogProps) => {
	const getFileType = (url: string): "image" | "video" => {
		if (url.startsWith("data:image/")) return "image";
		const extension = url.split("/").pop()?.split(".").pop()?.toLowerCase() ?? "";

		const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
		return imageExtensions.includes(extension) ? "image" : "video";
	};
	const FileUploadBtnRef = useRef<HTMLInputElement>(null);

	return (
		<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
			<Dialog.Trigger asChild>
				<IconWithSVG
					data-tooltip-id="icon-message-dropdown-menu-id"
					data-tooltip-content="Edit"
					className="icon-message-tooltip text-lg"
				>
					<FiEdit />
				</IconWithSVG>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[11000] animate-in fade-in-0" />
				<Dialog.Content
					onInteractOutside={(e) => e.preventDefault()}
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md h-fit bg-surface text-text rounded-2xl p-6 py-4 shadow-xl z-[12000] flex flex-col animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
				>
					<Dialog.Close asChild className="!absolute !top-2 !right-2">
						<IconWithSVG className="!rounded-md icon-small bg-accent/40 hover:bg-accent/60">
							<HiOutlineX />
						</IconWithSVG>
					</Dialog.Close>

					<Dialog.Title className="text-xl font-semibold text-foreground">Edit Image</Dialog.Title>

					<div className="flex flex-col justify-center my-5 gap-3">
						<div className="flex gap-2 flex-wrap max-h-100 overflow-y-auto img-upload-scrollbar rounded-md">
							{uploaded.length === 0 && (
								<div
									// onClick={handleImageUpload}
									onClick={() => {
										console.log(" FileUploadBtnRef.current: ", FileUploadBtnRef.current);
										FileUploadBtnRef.current?.click();
									}}
									className={clsx(
										"h-56 flex-1 w-full mt-1 group rounded-md items-center justify-center cursor-pointer relative flex flex-col bg-background"
									)}
								>
									<div className="flex flex-col gap-2 items-center">
										<FiCamera className="text-muted text-3xl" />
										<span className="text-muted font-semibold">Upload a new Image</span>
									</div>
									<IconWithSVG type="button" className="!absolute !w-6 !h-6 !p-0 !rounded-md top-1 right-1 bg-primary">
										<GoPlus className="text-xl text-white"></GoPlus>
									</IconWithSVG>
								</div>
							)}
							{uploaded.map((src, i) => (
								<div key={`${src}-${i}`} className="flex-1 aspect-square min-h-30 max-h-56 relative group">
									{getFileType(src) == "image" && (
										<>
											<img src={src} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
											<IconWithSVG
												disabled={isUploading}
												onClick={() => removeFileUpload(i)}
												className="!absolute disabled:opacity-0 top-1 right-1 icon-small group-hover:opacity-100 opacity-0 btn-secondary-border outline-0 border-foreground"
											>
												<IoClose />
											</IconWithSVG>
										</>
									)}

									{getFileType(src) == "video" && (
										<>
											<video src={src} controls muted autoPlay loop className="w-full h-full object-cover rounded-lg" />
											<IconWithSVG
												disabled={isUploading}
												onClick={() => removeFileUpload(i)}
												className="!absolute disabled:opacity-0 top-1 right-1 icon-small group-hover:opacity-100 opacity-0 btn-secondary-border outline-0 border-foreground"
											>
												<IoClose />
											</IconWithSVG>
										</>
									)}
								</div>
							))}
						</div>

						<div className="flex items-center gap-2">
							<input
								disabled={isUploading}
								type="checkbox"
								id="compress-file-checkbox"
								checked={compress}
								onChange={(e) => setCompress(e.target.checked)}
								className={clsx(
									"h-5.5 w-5.5 rounded-sm text-primary border-transparent focus:ring-primary focus:ring-offset-0 shadow-none ring-0 outline-none cursor-pointer"
								)}
							/>
							<label
								htmlFor="compress-file-checkbox"
								className="text-gray-700 dark:text-gray-300 cursor-pointer select-none"
							>
								Compress File
							</label>
						</div>
						{!compress && (
							<p className="text-sm text-muted p-2 rounded-md bg-background flex gap-2 items-center">
								<span>⚠️</span>Sending uncompressed images may slow down chats and take longer to upload.
							</p>
						)}
					</div>

					<div className="flex justify-end gap-3 mt-auto">
						<FileUploadBtn
							ref={FileUploadBtnRef}
							disabled={isUploading}
							selectedFiles={selectedFiles}
							setSelectedFiles={setSelectedFiles}
							compress={compress}
							setUploaded={setUploaded}
							className="mr-auto btn btn-secondary"
						>
							Add
						</FileUploadBtn>
						<Dialog.Close asChild>
							<button className="btn btn-secondary">Close</button>
						</Dialog.Close>
						<button
							onClick={handleUpload}
							disabled={isUploading}
							className={clsx("btn btn-purple flex gap-2 items-center", isUploading && "cursor-not-allowed opacity-50")}
						>
							Update Image
							{isUploading && (
								<div className="animate-spin rounded-full mt-0.5 h-4 w-4 border-2 border-transparent border-t-foreground border-r-foreground"></div>
							)}
						</button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

interface FileUploadBtnProps {
	children?: ReactNode;
	selectedFiles: File[];
	setSelectedFiles: Dispatch<SetStateAction<File[]>>;
	setUploaded: Dispatch<SetStateAction<string[]>>;
	onClick?: () => void;
	compress?: boolean;
	handleFileUpload?: () => void;
	[key: string]: any;
}

const FileUploadBtn = forwardRef<HTMLInputElement, FileUploadBtnProps>((props, ref) => {
	const { children, selectedFiles, setSelectedFiles, onClick, compress, setUploaded, handleFileUpload, ...rest } =
		props;

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const newFiles = Array.from(e.target.files);
		setSelectedFiles((prev: File[]) => [...prev, ...newFiles]);
		previewMultipleFiles(e.target.files);
	};

	const readFileAsDataUrl = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				if (e.target?.result) {
					resolve(e.target.result as string);
				} else {
					reject(new Error("File reading failed"));
				}
			};
			reader.onerror = () => {
				reject(new Error("File reading error"));
			};
			reader.readAsDataURL(file);
		});
	};

	const previewMultipleFiles = (files: FileList) => {
		const fileReaders: Promise<string>[] = [];

		for (let i = 0; i < files.length; i++) {
			fileReaders.push(readFileAsDataUrl(files[i]));
		}

		Promise.all(fileReaders)
			.then((results) => {
				setUploaded((prev: string[]) => [...prev, ...results]);
			})
			.catch((error) => {
				console.error("Error reading files:", error);
			});
	};

	return (
		<>
			{children && (
				<label {...rest} htmlFor="img-upload-input">
					{children}
				</label>
			)}
			<input
				ref={ref}
				id="img-upload-input"
				type="file"
				accept="image/*,video/*"
				className="hidden"
				multiple
				onChange={handleFileChange}
			/>
		</>
	);
});
