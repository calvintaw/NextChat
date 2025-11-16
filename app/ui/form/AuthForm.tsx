"use client";
import { IoLogoPolymer } from "react-icons/io";
import { RiMailLine, RiUserLine } from "react-icons/ri";
import { useActionState } from "react";
import { authenticate } from "@/app/lib/actions";
import { FaExclamation } from "react-icons/fa6";
import { FaGithub, FaGoogle } from "react-icons/fa";
import Link from "next/link";
import { Button } from "../general/Buttons";
import { signIn } from "next-auth/react";
import InputField, { PasswordField } from "./InputField";
import { clsx } from "clsx";
import { ImSpinner9 } from "react-icons/im";
import { Route } from "next";
import { BiLoaderAlt } from "react-icons/bi";

export const AuthFormWrapper = ({ className, children }: { className?: string; children: React.ReactNode }) => {
	return (
		<div
			className={clsx(
				"my-auto max-sm:w-[95%] min-w-80 w-fit h-fit m-auto rounded-2xl ring-1 ring-foreground/25 p-6 flex flex-col gap-2 bg-background",
				className
			)}
		>
			{children}
		</div>
	);
};

export default function AuthForm() {
	const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

	return (
		<AuthFormWrapper>
			<form action={formAction} className="flex flex-col">
				<div className="flex gap-2 items-center">
					<IoLogoPolymer className="text-5xl"></IoLogoPolymer>
					<h2 className="text-2xl">NextChat</h2>
				</div>
				<p className="text-muted text-sm mb-4">Create your account and start connecting today </p>

				<InputField disabled={isPending} name="name" label="Name" placeholder="Enter your name" icon={<RiUserLine />} />

				<InputField
					disabled={isPending}
					name="email"
					label="Email"
					type="email"
					icon={<RiMailLine />}
					placeholder="Enter your email"
				/>

				<PasswordField disabled={isPending} name="password" label="Password"></PasswordField>

				<TermsAndServices></TermsAndServices>

				{errorMessage && (
					<>
						<p className="flex items-center text-sm text-red-500">
							<FaExclamation className="h-5 w-5 text-red-500" />
							{errorMessage.error}
						</p>
					</>
				)}

				<Button
					disabled={isPending}
					type="submit"
					className="my-4 py-2 bg-primary hover:bg-primary/80 w-full btn-with-icon"
				>
					{isPending ? "Signing up" : "Sign up"}
					{isPending && <BiLoaderAlt className="animate-spin text-lg"></BiLoaderAlt>}
				</Button>

				<p className="text-muted text-sm">
					Already have an account?{" "}
					<Link href={"/login"} className="link">
						Login
					</Link>
				</p>

				<div className="flex items-center gap-4 my-4">
					<hr className="flex-1 border-t border rounded-full" />
					<p className="text-muted text-sm font-semibold">OR</p>
					<hr className="flex-1 border-t border rounded-full" />
				</div>
			</form>

			<AuthOptions></AuthOptions>
		</AuthFormWrapper>
	);
}

export const TermsAndServices = () => {
	return (
		<div className="flex items-center gap-2 text-muted mt-1 ml-0.5 text-sm">
			<input
				type="checkbox"
				defaultChecked
				name="term-services-agree"
				className="form-checkbox size-4.5 rounded-sm transform"
			/>
			I agree to the
			<Link href={"/terms_and_services" as Route} className="text-primary hover:underline cursor-pointer -ml-1">
				Terms and Conditions
			</Link>
		</div>
	);
};

export const AuthOptions = ({ className }: { className?: string }) => {
	return (
		<div className={clsx("grid grid-flow-row-dense md:grid-cols-2 grid-cols-1 gap-3", className)}>
			<Button
				className="w-full h-10 flex items-center justify-center font-semibold btn-third"
				onClick={() => signIn("github")}
			>
				<FaGithub className="mr-3" /> Sign in with GitHub
			</Button>

			<Button
				className="w-full h-10 flex items-center justify-center bg-white text-gray-700 font-semibold border border-indigo-300 hover:bg-indigo-100"
				disabled
				onClick={() => signIn("google")}
			>
				<FaGoogle className="mr-3" />
				<span className="font-semibold">
					Sign in with&nbsp;
					<span className="text-[#4285F4]">G</span>
					<span className="text-[#DB4437]">o</span>
					<span className="text-[#F4B400]">o</span>
					<span className="text-[#0F9D58]">g</span>
					<span className="text-[#DB4437]">l</span>
					<span className="text-[#4285F4]">e</span>
				</span>{" "}
			</Button>
		</div>
	);
};
