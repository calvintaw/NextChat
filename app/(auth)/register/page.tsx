"use client";
import { registerUser } from "@/app/lib/actions";
import { AuthFormWrapper, AuthOptions, TermsAndServices } from "@/app/ui/form/AuthForm";
import { Button } from "@/app/ui/general/Buttons";
import InputField, { PasswordField } from "@/app/ui/form/InputField";
import Link from "next/link";
import React, { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { IoLogoPolymer } from "react-icons/io";
import { RiUserLine, RiMailLine, RiAtLine } from "react-icons/ri";
import { FormState } from "@/app/lib/definitions";
import { ImSpinner9 } from "react-icons/im";

import { useRouter } from "next/navigation";

const Page = () => {
	const [data, setData] = useState<FormState>({ errors: {}, message: "" });
	const [isPending, setIsPending] = useState(false);
	const router = useRouter();

	const handleFormSubmit = async (formData: FormData) => {
		const data = await registerUser(formData);

		if (data.message.trim() !== "") {
			setData(data);
		} else {
			router.push("/dashboard");	
		}
	};

	return (
		<>
			<AuthFormWrapper className="max-w-166">
				<form
					onSubmit={async (e) => {
						e.preventDefault();
						setIsPending(true);

						const formData = new FormData(e.currentTarget);
						await handleFormSubmit(formData);
						setIsPending(false);

					}}
					className="form gap-1.5"
				>
					<div role="heading" className=" items-center gap-2 hidden sm:flex">
						<IoLogoPolymer className="text-5xl"></IoLogoPolymer>
						<h2 className="text-2xl">NextChat</h2>
					</div>
					<p className="text-foreground sm:text-muted text-2xl max-sm:font-semibold mb-8 sm:text-sm flex items-center">
						<IoLogoPolymer className="text-5xl mr-2 sm:hidden"></IoLogoPolymer>
						Create your account <span className="hidden sm:inline-block">and start connecting today</span>{" "}
					</p>

					<div className="flex mb-0.5 sm:flex-row flex-col sm:gap-2 gap-1.5">
						<InputField
							errors={data.errors.displayName}
							name="displayName"
							placeholder="Display name"
							icon={<RiUserLine />}
						/>
						<InputField errors={data.errors.username} name="username" placeholder="username" icon={<RiAtLine />} />
					</div>

					<div className="flex flex-col gap-2">
						<InputField
							errors={data.errors.email}
							name="email"
							type="email"
							icon={<RiMailLine />}
							placeholder="Enter your email"
						/>

						<PasswordField errors={data.errors.password} name="password"></PasswordField>
					</div>

					{data.message && <span className="text-sm text-red-500">{data.message}</span>}

					<TermsAndServices></TermsAndServices>

					<Button
						disabled={isPending}
						type="submit"
						className="mt-8 mb-2 py-2 bg-primary hover:bg-primary/80 w-full items-center justify-center btn-with-icon"
					>
						{isPending ? "Creating account..." : "Create Account"}
						{isPending && <ImSpinner9 className="animate-spin"></ImSpinner9>}
					</Button>
					<p className="text-muted text-sm">
						Already have an account?{" "}
						<Link href={"/login"} className="text-primary no-underline font-semibold hover:underline">
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
		</>
	);
};

export default Page;
