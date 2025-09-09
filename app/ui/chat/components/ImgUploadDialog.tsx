
import * as Dialog from "@radix-ui/react-dialog";
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import { IconWithSVG } from "../../general/Buttons";
import { FileUploadBtn } from "./UploadButtons";
import { Dispatch, SetStateAction } from "react";

export interface ImageUploadDialogProps {
	isUploading: boolean;
	dialogOpen: boolean;
	setDialogOpen: Dispatch<SetStateAction<boolean>>;
	uploaded: string[];
	setUploaded: Dispatch<SetStateAction<string[]>>;
	removeFileUpload: (index: number) => void;
	compress: boolean;
	setCompress: Dispatch<SetStateAction<boolean>>;
	selectedFiles: File[];
	setSelectedFiles: Dispatch<SetStateAction<File[]>>;
	setDropdownOpen: Dispatch<SetStateAction<boolean>>;
	handleUpload: () => void;
}

const ImageUploadDialog = ({
	isUploading,
	dialogOpen,
	setDialogOpen,
	uploaded,
	removeFileUpload,
	compress,
	setCompress,
	selectedFiles,
	setSelectedFiles,
	setUploaded,
	setDropdownOpen,
	handleUpload,
}: ImageUploadDialogProps) => {
	const getFileType = (url: string): "image" | "video" => {
		if (url.startsWith("data:image/")) return "image";
		return "video";
	};

	return (
		<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-black/70 z-[999] animate-in fade-in-0" />
				<Dialog.Content
					onInteractOutside={(e) => e.preventDefault()}
					className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md h-fit bg-surface text-text rounded-2xl p-6 shadow-xl z-[1000] flex flex-col animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
				>
					<Dialog.Title className="text-xl font-semibold text-foreground">Send an Image</Dialog.Title>

					<div className="flex flex-col justify-center my-5 gap-3">
						<div className="flex gap-2 flex-wrap max-h-[400px] overflow-y-scroll img-upload-scrollbar rounded-md">
							{uploaded.map((src, i) => (
								<div key={`${src}-${i}`} className="flex-1 aspect-square min-h-[120px] max-h-[225px] relative group">
									{getFileType(src) == "image" && (
										<>
											<img src={src} alt="Uploaded preview" className="w-full h-full object-cover rounded-lg" />
											<IconWithSVG
												onClick={() => removeFileUpload(i)}
												className="!absolute top-1 right-1 icon-small group-hover:opacity-100 opacity-0"
											>
												<IoClose />
											</IconWithSVG>
										</>
									)}

									{getFileType(src) == "video" && (
										<>
											<video src={src} controls muted autoPlay loop className="w-full h-full object-cover rounded-lg" />
											<IconWithSVG
												onClick={() => removeFileUpload(i)}
												className="!absolute top-1 right-1 icon-small group-hover:opacity-100 opacity-0"
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
					</div>

					<div className="flex justify-end gap-3 mt-auto">
						<FileUploadBtn
							selectedFiles={selectedFiles}
							setSelectedFiles={setSelectedFiles}
							compress={compress}
							setDropdownOpen={setDropdownOpen}
							setDialogOpen={setDialogOpen}
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
							Send Image
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

export default ImageUploadDialog;
