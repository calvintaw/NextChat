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
	const [errorMessage, formAction, isPending] = useActionState(authenticate, "");

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
							{errorMessage}
						</p>
					</>
				)}

				<Button
					disabled={isPending}
					type="submit"
					className="my-4 py-2 bg-primary hover:bg-primary/80 w-full btn-with-icon"
				>
					{isPending ? "Signing up" : "Sign up"}
					{isPending && <ImSpinner9 className="animate-spin"></ImSpinner9>}
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

import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

export const TermsAndServices = () => {
	return (
		<div className="flex items-center gap-2 text-muted mt-1 ml-0.5 text-sm">
			<input type="checkbox" defaultChecked name="term-services-agree" className="form-checkbox size-4.5 rounded-sm transform" />I agree to the
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<span className="text-primary hover:underline cursor-pointer -ml-1">Terms and Conditions</span>
				</DropdownMenu.Trigger>

				<DropdownMenu.Portal>
					<DropdownMenu.Content
						className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-119  max-h-[450px] overflow-y-scroll
							bg-surface text-text rounded-2xl px-5 py-4 pt-7.5 shadow-lg shadow-black/95 not-dark:shadow-black/25
							animate-in fade-in-0 zoom-in-95 z-[100] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 pb-25"
					>
						<h2 className="text-lg font-bold mb-2">Terms and Conditions</h2>
						<p className="text-sm text-muted mb-2">Last updated: 2/5/2025</p>

						<section className="mb-2">
							<h3 className="font-semibold">1. Introduction</h3>
							<p className="text-sm text-muted">
								Welcome to [Your Company Name]! By using our services, you agree to these terms and conditions.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">2. Use of Service</h3>
							<p className="text-sm text-muted">
								You agree to use the Service only for lawful purposes and in a manner that does not infringe on the
								rights of others.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">3. Account Registration</h3>
							<p className="text-sm text-muted">
								Some parts of the Service require registration. You are responsible for maintaining the confidentiality
								of your account.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">4. Intellectual Property</h3>
							<p className="text-sm text-muted">
								All content, trademarks, and logos are the property of [Your Company Name] or its licensors.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">5. Limitation of Liability</h3>
							<p className="text-sm text-muted">
								The Service is provided "as is." [Your Company Name] is not liable for any damages arising from use of
								the Service.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">6. Privacy</h3>
							<p className="text-sm text-muted">
								Your use of the Service is governed by our Privacy Policy, which explains how we collect and use your
								data.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">7. Termination</h3>
							<p className="text-sm text-muted">
								We may suspend or terminate your access at any time for violations of these Terms.
							</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">8. Governing Law</h3>
							<p className="text-sm text-muted">These Terms are governed by the laws of [Your State/Country].</p>
						</section>

						<section className="mb-2">
							<h3 className="font-semibold">9. Changes to Terms</h3>
							<p className="text-sm text-muted">
								We may update these Terms at any time. Continued use constitutes acceptance.
							</p>
						</section>

						<section>
							<h3 className="font-semibold">10. Contact Us</h3>
							<p className="text-sm text-muted">
								Email: nextchat@gmail.com <br />
								Phone: 1234-5678-9012
							</p>
						</section>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
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
