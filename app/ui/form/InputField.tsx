"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { RiLockLine } from "react-icons/ri";
import clsx from "clsx";
import zxcvbn from "zxcvbn";
import { useToast } from "@/app/lib/hooks/useToast";

type InputFieldProps = {
	label?: string | React.ReactNode;
	name: string;
	success?: string;
	icon?: ReactNode;
	errors?: string[];
	className?: string;
	parentClassName?: string;
	labelClassName?: string;
	place?: "left" | "right";
	hideRules?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> &
	React.RefAttributes<HTMLInputElement>;

export default function InputField({
	label,
	name,
	icon = null,
	type = "text",
	className,
	placeholder,
	errors,
	success,
	parentClassName = "",
	labelClassName = "",
	place = "left",
	ref,
	...props
}: InputFieldProps) {
	return (
		<fieldset>
			<label htmlFor={name} className="flex flex-col gap-1 font-medium text-muted">
				{label && <span className={`text-text font-semibold ${labelClassName}`}>{label}</span>}
				<div className={clsx("form-input_custom", success && "border-success", !icon && "pl-0", parentClassName)}>
					{place === "left" && icon && <div className="text-muted flex items-center justify-center">{icon}</div>}
					<input id={name} name={name} placeholder={placeholder} className={className} ref={ref} {...props} />
					{place === "right" && icon && <div className="text-muted flex items-center justify-center">{icon}</div>}
				</div>
				{errors?.length !== 0 &&
					!success &&
					errors?.map((error) => (
						<p className="my-0.5 text-sm text-red-500" key={error}>
							{error}
						</p>
					))}
				{success && <p className="my-0.5 text-sm text-success">{success}</p>}
			</label>
		</fieldset>
	);
}

const RULES = [
	{ label: "At least 1 uppercase letter", regex: /[A-Z]/ },
	{ label: "At least 1 lowercase letter", regex: /[a-z]/ },
	{ label: "At least 1 number", regex: /\d/ },
	{ label: "At least 1 symbol", regex: /[!@#$%^&*()\[\]{}\-_.+=<>?/\\|~]/ },
	{ label: "Minimum 8 characters", regex: /.{8,}/ },
];

type PasswordFieldProps = InputFieldProps & {
	setIsAllowed?: React.Dispatch<React.SetStateAction<boolean>>;
	fnToCallOnChange?: () => void;
	actionStatus?: "idle" | "pending" | "finished";
};

export function PasswordField({
	name,
	label,
	placeholder = "Enter your password",
	errors,
	className,
	parentClassName = "",
	actionStatus,
	hideRules = false,
	setIsAllowed,
	fnToCallOnChange = () => {},
}: PasswordFieldProps) {
	const [showPass, setShowPass] = useState(false);
	const [value, setValue] = useState("");
	const [score, setScore] = useState(0);
	const [zxcvbnScore, setZxcvbnScore] = useState<number | null>(null);
	const toast = useToast()

	useEffect(() => {
		if (!actionStatus) return;

		if (actionStatus === "finished") {
			setValue("");
		}
	}, [actionStatus]);

	useEffect(() => {
		if (hideRules) return;
		const newScore = RULES.reduce((acc, rule) => {
			const matched = rule.regex.test(value);
			console.log(`[RULES CHECK] ${rule.label}:`, matched); // log each rule check
			return matched ? acc + 1 : acc;
		}, 0);
		setScore(newScore);

		if (value.trim() === "") {
			console.log("ZXCVBN SCORE SET TO NULL");
			setZxcvbnScore(null);
			return;
		}

		const result = zxcvbn(value);
		setZxcvbnScore(result.score); // 0 - 4
		console.log("[ZXCVBN SCORE]", result.score, result); // log full result
	}, [value, hideRules]);

	useEffect(() => {
		if (hideRules) return;

		const inputEl = document.getElementById(name);
		if (!inputEl) return;

		const form = inputEl.closest("form");
		if (!form) return;

		const handleSubmit = (e: Event) => {
			const isValid = RULES.every((rule) => rule.regex.test(value));
			console.log("[FORM SUBMIT] value:", value);
			console.log("[FORM SUBMIT] RULES valid:", isValid);
			console.log("[FORM SUBMIT] zxcvbnScore:", zxcvbnScore);

			if (!isValid || (zxcvbnScore && zxcvbnScore < 3)) {
				e.preventDefault(); // stop form submission
				console.log("[FORM SUBMIT] Password rejected");
				toast({ title: "Warning!", mode: "negative", subtitle: "Please fix your password first!" });
			}

			if (isValid && setIsAllowed && zxcvbnScore && zxcvbnScore >= 3) {
				console.log("[FORM SUBMIT] Password allowed");
				setIsAllowed(true);
			}
		};

		form.addEventListener("submit", handleSubmit);

		return () => form.removeEventListener("submit", handleSubmit);
	}, [value, name, hideRules, zxcvbnScore]);

	return (
		<fieldset className="mb-2">
			<label htmlFor={name} className="flex flex-col gap-1 font-medium text-muted">
				{label && <span className="text-primary/80 font-semibold">{label}</span>}
				<div className={clsx("form-input_custom", parentClassName)}>
					<RiLockLine className="text-lg text-muted" />
					<input
						required
						id={name}
						name={name}
						value={value}
						onChange={(e) => {
							setValue(e.target.value);
							fnToCallOnChange();
						}}
						type={showPass ? "text" : "password"}
						placeholder={placeholder}
						className={className}
					/>

					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => setShowPass((prev) => !prev)}
						className="text-2xl text-muted icon-small bg-transparent p-0 m-0"
					>
						{showPass ? <FaEye /> : <FaEyeSlash />}
					</button>
				</div>

				{errors?.length !== 0 &&
					errors?.map((error) => (
						<p className="my-0.5 text-sm text-red-500" key={error}>
							{error}
						</p>
					))}
			</label>

			{/* Password rules UI */}
			{!hideRules && (
				<div
					className="password-rules mt-2 mx-4"
					data-score={score}
					style={{ "--score": score, "--total": RULES.length } as React.CSSProperties}
				>
					{/* zxcvbn strength meter */}
					{zxcvbnScore !== null && (
						<>
							<div className="mt-2 text-sm">
								<p className="">
									Password strength:
									<span
										className={clsx(
											"ml-1 font-semibold",
											zxcvbnScore < 2 && "text-red-500",
											zxcvbnScore === 2 && "text-yellow-500",
											zxcvbnScore >= 3 && "text-green-600"
										)}
									>
										{["Very Weak", "Weak", "Fair", "Strong", "Very Strong"][zxcvbnScore]}
									</span>
								</p>
							</div>
						</>
					)}

					<div className="password-rules__meter flex-1 w-full">
						<span></span>
						<span></span>
						<span></span>
						<span></span>
						<span></span>
						<div className="password-rules__score ml-1 -mt-0.5"></div>
					</div>

					<ul className="password-rules__checklist list-disc pl-5 text-sm text-muted">
						{RULES.map((rule, idx) => {
							const isMatched = rule.regex.test(value); // rule already satisfied
							// only show the first unfinished rule
							if (!isMatched && !RULES.slice(0, idx).some((r) => !r.regex.test(value))) {
								return (
									<li key={idx} className={clsx({ "is-match": isMatched })}>
										{rule.label}
									</li>
								);
							}
							return null; // hide all other rules
						})}
					</ul>
				</div>
			)}
		</fieldset>
	);
}
