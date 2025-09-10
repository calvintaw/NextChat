import { BsFileEarmarkTextFill } from "react-icons/bs";
import { FaPlus } from "react-icons/fa6";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import imageCompression from "browser-image-compression";
import { IconWithSVG } from "@/app/ui/general/Buttons";
import {supabase} from "@/app/lib/supabase";
import { nanoid } from "nanoid";
import { useState } from "react";
import ImageUploadDialog from "./ImgUploadDialog";
import { FileUploadBtn } from "./UploadButtons";

type Props = {
	handleFileUpload: (url: string[], type: "image" | "video") => void;
};

export const AttachmentDropdown = ({ handleFileUpload }: Props) => {
	const [uploaded, setUploaded] = useState<string[]>([]); 	// array used for storing base64 encoded strings of imgs or videos url to display locally in browser
	const [dialogOpen, setDialogOpen] = useState(false); // manually control dialog box Open State as UI has some special requirements
	const [dropdownOpen, setDropdownOpen] = useState(false); // same with this dropdown
	const [compress, setCompress] = useState(true); // compress images option YES/NO
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // the data actually used to store images in database

	const handleUpload = async () => {
		if (isUploading) {
			alert("Uploading File...");
			return;
		}

		console.count("clicked handleUpload");
		if (selectedFiles.length < 1) {
			console.log("sorrry: return");
			return;
		}

		setIsUploading(true);
		try {
			const options = {
				maxSizeMB: 0.6,
				maxWidthOrHeight: 1280,
				useWebWorker: true,
				initialQuality: 0.8,
			};

			const imgArray = [];
			const videoArray = [];
			for (let selectedFile of selectedFiles) {
				const type = selectedFile.type;

				const compressedFile =
					compress && type.startsWith("image/") ? await imageCompression(selectedFile, options) : selectedFile;

				const filename = `${nanoid()}.${compressedFile.name.split(".").pop()}`;

				const { data, error } = await supabase.storage.from("uploads").upload(filename, compressedFile);

				if (error) throw error;

				const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(data?.path || "");

				if (publicData?.publicUrl) {
					if (type.startsWith("image/")) {
						imgArray.push(publicData.publicUrl);
					} else {
						videoArray.push(publicData.publicUrl);
					}
				}
			}

			if (imgArray.length > 0) {
				handleFileUpload(imgArray, "image");
			}
			if (videoArray.length > 0) {
				handleFileUpload(videoArray, "video");
			}

			setUploaded([]);
		} catch (err) {
			console.error("Upload error:", err);
		} finally {
			setIsUploading(false);
		}
	};

	const removeFileUpload = (index: number) => {
		setUploaded((prev) => prev.filter((src, i) => i !== index));
		setSelectedFiles((prev) => prev.filter((file, i) => i !== index));
	};

	return (
		<div className="min-h-10 flex items-center justify-center">
			{/* Easy access for opening img form */}
			{/* <button className="btn btn-primary mr-2" onClick={() => setDialogOpen((prev) => !prev)}>
				Toggle Dialog
			</button> */}
			<DropdownMenu.Root open={dropdownOpen} onOpenChange={(open) => setDropdownOpen(open)}>
				<DropdownMenu.Trigger asChild>
					<IconWithSVG
						className="
                     !size-7.5
                     group
                     !rounded-full
                     p-0
                     m-0
                     border-0

                     not-dark:bg-secondary
											outline-none
											ring-0

                     hover:bg-foreground
                     data-[state=open]:bg-foreground
                  "
					>
						<FaPlus
							className="
                        text-sm
                        not-dark:group-hover:text-white
                        group-hover:text-black
                        group-data-[state=open]:text-black
												not-dark:group-data-[state=open]:text-white
                     "
						/>
					</IconWithSVG>
				</DropdownMenu.Trigger>

				<DropdownMenu.Content loop sideOffset={20} align="start" className="DropdownMenu__Content">
					<DropdownMenu.Item asChild>
						<FileUploadBtn
							selectedFiles={selectedFiles}
							setSelectedFiles={setSelectedFiles}
							compress={compress}
							setDropdownOpen={setDropdownOpen}
							setDialogOpen={setDialogOpen}
							setUploaded={setUploaded}
						/>
					</DropdownMenu.Item>

					<DropdownMenu.Item className="DropdownMenuItem">
						<BsFileEarmarkTextFill />
						Document
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			{uploaded.length > 0 && (
				<ImageUploadDialog
					isUploading={isUploading}
					dialogOpen={dialogOpen}
					setDialogOpen={setDialogOpen}
					uploaded={uploaded}
					removeFileUpload={removeFileUpload}
					compress={compress}
					setCompress={setCompress}
					selectedFiles={selectedFiles}
					setSelectedFiles={setSelectedFiles}
					setUploaded={setUploaded}
					setDropdownOpen={setDropdownOpen}
					handleUpload={handleUpload}
				/>
			)}
		</div>
	);
};
