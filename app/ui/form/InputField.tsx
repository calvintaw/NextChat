"use client";
import { ReactNode, useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { RiLockLine } from "react-icons/ri";
import clsx from "clsx";
import useToggle from "../../lib/hooks/useToggle";
import { error } from "console";
import React from "react";

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
	{ regex: /[a-z]/, label: "Includes a lowercase letter" },
	{ regex: /[A-Z]/, label: "Includes an uppercase letter" },
	{ regex: /\d/, label: "Includes a number" },
	{ regex: /[\W_]/, label: "Includes a special character" },
	{ regex: /.{9,}/, label: "Longer than 8 characters" },
];

export function PasswordField({
	name,
	label,
	placeholder = "Enter your password",
	errors,
	className,
	parentClassName = "",
	hideRules = false,
}: InputFieldProps) {
	const [showPass, setShowPass] = useState(false);
	const [value, setValue] = useState("");
	const [score, setScore] = useState(0);

	useEffect(() => {
		const newScore = RULES.reduce((acc, rule) => (rule.regex.test(value) ? acc + 1 : acc), 0);
		setScore(newScore);
	}, [value]);

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
						onChange={(e) => setValue(e.target.value)}
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
