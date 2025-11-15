"use client";

import { IoLogoPolymer } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa6";
import { RiMailLine } from "react-icons/ri";
import { useActionState, useEffect, useRef, useState } from "react";
import { authenticate } from "@/app/lib/actions";
import useToggle from "@/app/lib/hooks/useToggle";
import { FaExclamation } from "react-icons/fa6";
import Link from "next/link";
import { Button } from "@/app/ui/general/Buttons";

import InputField, { PasswordField } from "@/app/ui/form/InputField";
import clsx from "clsx";
import React from "react";
import { useRouter } from "next/navigation";
import { AuthFormWrapper, TermsAndServices, AuthOptions } from "@/app/ui/form/AuthForm";
import { ImSpinner9 } from "react-icons/im";
import { BiLoaderAlt } from "react-icons/bi";

const images = [
	{
		src: "/login/marketing_4.png",
		alt: "marketing_connect 1 - Top view of marked surface",
		description: "Connect Instantly",
	},
	{
		src: "/login/marketing_3.png",
		alt: "marketing_chat 2 - Close-up of edge detail",
		description: "Chats That Click",
	},
	{
		src: "/login/marketing_1.png",
		alt: "marketing_2 - Material texture after marketing_2",
		description: "Built to Last",
	},
	{
		src: "/login/marketing_2.png",
		alt: "marketing_3 - Marked sample under lighting",
		description: "Make Your Mark",
	},
];

export default function LoginPage() {
	return (
		<>
			<section
				className="h-screen w-screen p-2 md:p-6 flex items-center justify-center gap-6 @container *:
				max-[998px]:bg-[url('/auth_bg.svg')]
			"
			>
				<ImageBox></ImageBox>
				<LoginForm></LoginForm>
			</section>
		</>
	);
}

function LoginForm() {
	const [error, formAction, isPending] = useActionState(authenticate, "");
	const [errorMessage, setErrorMessage] = useState("");
	const formRef = useRef<HTMLFormElement | null>(null);

	useEffect(() => {
		setErrorMessage(error ?? "");
	}, [error]);

	return (
		<AuthFormWrapper className="bg-background max-w-[440px]">
			<form ref={formRef} onSubmit={() => setErrorMessage("")} action={formAction} className="form ">
				<div role="heading" className="flex items-center gap-2">
					<IoLogoPolymer className="text-5xl"></IoLogoPolymer>
					<h2 className="text-3xl font-semibold">Welcome back!</h2>
				</div>
				<p className="text-muted text-sm mb-8">Log in to access your account.</p>

				<div className="flex flex-col gap-3">
					<InputField
						disabled={isPending}
						name="identifier"
						type="email"
						icon={<RiMailLine />}
						placeholder="Enter your email or username"
						required
						onChange={() => errorMessage && setErrorMessage("")}
					/>
					<PasswordField
						fnToCallOnChange={() => errorMessage && setErrorMessage("")}
						hideRules
						disabled={isPending}
						name="password"
					></PasswordField>
				</div>

				{errorMessage && <span className="text-sm text-red-500">{errorMessage}</span>}

				<TermsAndServices />

				<Button
					disabled={isPending}
					type="submit"
					className="mt-8 mb-4 py-2 bg-primary hover:bg-primary/80 w-full btn-with-icon justify-center"
				>
					{isPending ? "Logging in" : "Log in"}
					{isPending && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
				</Button>

				<p className="text-muted text-sm">
					Don't have an account?{" "}
					<Link href={"/register"} className="link text-primary">
						Sign up
					</Link>
				</p>

				<div className="flex items-center gap-4 my-4">
					<hr className="flex-1 border-t border rounded-full" />
					<p className="text-muted text-sm font-semibold">OR</p>
					<hr className="flex-1 border-t border rounded-full" />
				</div>
			</form>

			<AuthOptions className="sm:grid-cols-2"></AuthOptions>
		</AuthFormWrapper>
	);
}

type Props = {
	setSelectedId: React.Dispatch<React.SetStateAction<number>>;
	length: number;
	id: number;
	clearInterval: () => void;
};

const Pagination = ({ id, setSelectedId, length, clearInterval }: Props) => {
	const array = Array.from({ length }, (_, i) => i);

	return (
		<div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 z-50 gap-2 flex items-center">
			{array.map((i) => {
				return (
					<div
						key={i}
						onClick={() => {
							setSelectedId(i);
							clearInterval();
						}}
						className={clsx(
							"rounded-full cursor-pointer transition-all duration-300 border-2",
							id === i ? "w-15 h-4 bg-white border-2 border-black" : "w-12 h-2.5 bg-black border-black"
						)}
					></div>
				);
			})}
		</div>
	);
};

const ImageBox = () => {
	const [selectedId, setSelectedId] = useState(0);

	const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (intervalId.current) clearInterval(intervalId.current);

		intervalId.current = setInterval(() => {
			setSelectedId((prev) => (prev + 1) % images.length);
		}, 5000);

		return () => {
			if (intervalId.current) clearInterval(intervalId.current);
		};
	}, []);

	return (
		<div
			className="
		p-2	
		flex flex-1
		@max-[950px]:hidden
		w-full h-full
		bg-linear-to-r from-green-500 via-emerald-500 to-teal-500
		rounded-3xl
		z-[1200]
		"
		>
			<div
				className="relative flex flex-1 rounded-2xl 
	
		
		h-full w-full overflow-hidden"
			>
				<div className="absolute top-4 left-2 right-3 mx-3 flex items-center justify-between gap-2 z-30">
					<div role="heading" className="flex gap-2 items-center">
						<IoLogoPolymer className="text-5xl text-black"></IoLogoPolymer>
						<h2 className="text-3xl font-bold font-sans text-shadow-md text-black">NextChat</h2>
					</div>
				</div>
				{images.map((image, index) => (
					<React.Fragment key={image.src}>
						<img
							src={image.src}
							alt={image.alt}
							className={clsx(
								"absolute top-0 left-0 w-full h-full object-cover rounded-2xl transition-opacity duration-700 ease-in-out",
								selectedId === index ? "opacity-100 z-10" : "opacity-0 z-0"
							)}
						/>
						<span
							className={clsx(
								"absolute text-center bottom-15 left-1/2 transform -translate-x-1/2 text-text text-base sm:text-lg font-medium bg-background/75 px-6 py-2 rounded-xl shadow-lg shadow-black/30 border-2 border-border transition-opacity duration-700 ease-in-out",
								selectedId === index ? "opacity-100 z-20" : "opacity-0"
							)}
						>
							{image.description}
						</span>
					</React.Fragment>
				))}
				<Pagination
					id={selectedId}
					clearInterval={() => {
						if (intervalId.current) clearInterval(intervalId.current);
					}}
					setSelectedId={setSelectedId}
					length={images.length}
				></Pagination>
			</div>
		</div>
	);
};
