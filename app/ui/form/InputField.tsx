"use client";
import { ReactNode } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { RiLockLine } from "react-icons/ri";
import clsx from "clsx";
import useToggle from "../../lib/hooks/useToggle";
import { error } from "console";

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
				<div className={clsx("form-input_custom", success && "border-success",  !icon && "pl-0", parentClassName)}>
					{place === "left" && icon && <div className="text-muted flex items-center justify-center">{icon}</div>}
					<input
						id={name}
						name={name}
						placeholder={placeholder}
						className={className}
						ref={ref}
						{...props}
					/>
					{place === "right" && icon && <div className="text-muted flex items-center justify-center">{icon}</div>}
				</div>
				{errors?.length !== 0 && !success &&
					errors?.map((error) => (
						<p className="my-0.5 text-sm text-red-500" key={error}>
							{error}
						</p>
					))}
				{success && (
					<p className="my-0.5 text-sm text-success">
						{success}
					</p>
				)}
			</label>
		</fieldset>
	);
}


export function PasswordField({
	name,
	label,
	placeholder = "Enter your password",
	errors,
	className,
	parentClassName = "",
}: InputFieldProps) {
	const [showPass, toggleShowPass] = useToggle(false);

	return (
		<fieldset className="mb-2">
			<label htmlFor={name} className="flex flex-col gap-1 font-medium text-muted">
				{label && <span className="text-primary/80 font-semibold">{label}</span>}
				<div className={clsx("form-input_custom", parentClassName)}>
					<RiLockLine className="text-lg text-muted" />

					<input
						autoComplete="off"
						id={name}
						defaultValue={""}
						name={name}
						type={showPass ? "text" : "password"}
						placeholder={placeholder}
						className={className}
						onKeyDown={(e) => {
							if (e.key === "Enter") e.preventDefault();
						}}
					/>

					<button
						type="button"
						onMouseDown={(e) => e.preventDefault()}
						onClick={toggleShowPass}
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
					))}{" "}
			</label>
		</fieldset>
	);
}
