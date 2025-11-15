import {
	ChangeEvent,
	Dispatch,
	forwardRef,
	ReactNode,
	SetStateAction,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { FiCamera } from "react-icons/fi";
import { GoPlus } from "react-icons/go";
import { HiPhoto } from "react-icons/hi2";
import { IconWithSVG } from "../../general/Buttons";
import clsx from "clsx";
import { IoMdClose } from "react-icons/io";

interface FileUploadBtnProps {
	children?: ReactNode;
	selectedFiles: File[];
	setSelectedFiles: Dispatch<SetStateAction<File[]>>;
	setUploaded: Dispatch<SetStateAction<string[]>>;
	setDropdownOpen: (open: boolean) => void;
	setDialogOpen: (open: boolean) => void;
	onClick?: () => void;
	compress?: boolean;
	handleFileUpload?: () => void;
	[key: string]: any;
}
export const FileUploadBtn = (props: FileUploadBtnProps) => {
	const {
		children,
		selectedFiles,
		setSelectedFiles,
		onClick,
		compress,
		setDropdownOpen,
		setUploaded,
		setDialogOpen,
		handleFileUpload,
		...rest
	} = props;

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
				setDialogOpen(true);
				setDropdownOpen(false);
			})
			.catch((error) => {
				console.error("Error reading files:", error);
			});
	};

	return (
		<>
			{/* being used in 2 differnt way but same logic so has some switch statements here */}
			{!children && (
				<label
					htmlFor="img-upload-input"
					className="DropdownMenuItem flex items-center gap-2 cursor-pointer w-full"
					{...rest}
				>
					<HiPhoto />
					<span>Photo or Video</span>
				</label>
			)}
			{children && (
				<label {...rest} htmlFor="img-upload-input">
					{children}
				</label>
			)}
			<input
				id="img-upload-input"
				type="file"
				accept="image/*,video/*"
				className="hidden"
				multiple
				onChange={handleFileChange}
			/>
		</>
	);
};
type ServerImageUploadBtnProps = {
	uploaded: string;
	publicImgUrl: string;
	setUploaded: React.Dispatch<React.SetStateAction<string>>;
	setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
};
export const ServerImageUploadBtn = ({
	uploaded,
	setUploaded,
	setSelectedFile,
	publicImgUrl,
}: ServerImageUploadBtnProps) => {
	const fileInputRef = useRef<null | HTMLInputElement>(null);

	const handleIconClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const newFile = e.target.files[0];
		setSelectedFile(newFile);
		previewFile(newFile);
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

	const previewFile = (file: File) => {
		readFileAsDataUrl(file)
			.then((result) => {
				setUploaded(result);
			})
			.catch((error) => {
				console.error("Error reading file:", error);
			});
	};

	const removeFileUpload = () => {
		setUploaded("");
		setSelectedFile(null);
	};

	return (
		<>
			<label htmlFor="server-img-upload-input" className="w-fit h-fit mx-auto">
				<div
					className={clsx(
						"size-20 group rounded-full items-center justify-center cursor-pointer relative flex flex-col",
						!uploaded && "border-2 border-dashed border-muted"
					)}
				>
					{!uploaded && (
						<>
							<FiCamera className="text-muted text-2xl" />
							<span className="text-muted font-semibold">Upload</span>

							<IconWithSVG
								type="button"
								onClick={handleIconClick}
								className="!absolute !w-6 !h-6 !p-0 !rounded-full top-0.5 -right-1 bg-primary"
							>
								<GoPlus className="text-xl text-white"></GoPlus>
							</IconWithSVG>
						</>
					)}
					{uploaded && (
						<>
							<img src={uploaded} alt="Uploaded preview" className="w-full h-full object-cover rounded-full" />
							<IconWithSVG
								type="button"
								onClick={removeFileUpload}
								className=" 
								group-hover:opacity-100 opacity-0
								!absolute !w-6 !h-6 !p-0 !rounded-full top-0.5 -right-1 bg-primary"
							>
								<IoMdClose className="text-lg text-white"></IoMdClose>
							</IconWithSVG>
						</>
					)}
				</div>
			</label>
			<input type="text" name="server_image" readOnly value={publicImgUrl} className="hidden" />
			<input
				ref={fileInputRef}
				id="server-img-upload-input"
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
		</>
	);
};

export const ServerBannerUploadBtn = ({
	uploaded,
	setUploaded,
	setSelectedFile,
	publicImgUrl,
}: ServerImageUploadBtnProps) => {
	const fileInputRef = useRef<null | HTMLInputElement>(null);

	const handleIconClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;

		const newFile = e.target.files[0];
		setSelectedFile(newFile);
		previewFile(newFile);
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

	const previewFile = (file: File) => {
		readFileAsDataUrl(file)
			.then((result) => {
				setUploaded(result);
			})
			.catch((error) => {
				console.error("Error reading file:", error);
			});
	};

	const removeFileUpload = () => {
		setUploaded("");
		setSelectedFile(null);
	};

	return (
		<>
			<label htmlFor="server-banner-upload-input" className="w-full h-fit mx-auto -mt-3">
				<span className=" font-semibold text-sm text-text">Server Banner</span>
				<div
					className={clsx(
						"h-30 w-full mt-1 group rounded-md items-center justify-center cursor-pointer relative flex flex-col bg-background"
					)}
				>
					{!uploaded && (
						<>
							<div className="flex gap-2 items-center">
								<FiCamera className="text-muted text-2xl" />
								<span className="text-muted font-semibold">Upload Banner</span>
							</div>
							<IconWithSVG
								type="button"
								onClick={handleIconClick}
								className="!absolute !w-6 !h-6 !p-0 !rounded-full top-0.5 -right-1 bg-primary"
							>
								<GoPlus className="text-xl text-white"></GoPlus>
							</IconWithSVG>
						</>
					)}
					{uploaded && (
						<>
							<img src={uploaded} alt="Uploaded Banner preview" className="w-full h-full object-contain rounded-md" />
							<IconWithSVG
								type="button"
								onClick={removeFileUpload}
								className=" 
								group-hover:opacity-100 opacity-0
								!absolute !w-6 !h-6 !p-0 !rounded-full top-0.5 -right-1 bg-primary"
							>
								<IoMdClose className="text-lg text-white"></IoMdClose>
							</IconWithSVG>
						</>
					)}
				</div>
			</label>
			<input type="text" name="server_image" readOnly value={publicImgUrl} className="hidden" />
			<input
				ref={fileInputRef}
				id="server-banner-upload-input"
				type="file"
				accept="image/*"
				className="hidden"
				onChange={handleFileChange}
			/>
		</>
	);
};
