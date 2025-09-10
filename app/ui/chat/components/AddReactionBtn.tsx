"use client";
import { FaSmileBeam, FaHeart, FaStar, FaThumbsUp, FaBell } from "react-icons/fa";
import { GoSmiley, GoHeartFill, GoStarFill, GoThumbsup, GoBellFill } from "react-icons/go";
import { HiEmojiHappy, HiHeart, HiStar, HiThumbUp, HiBell } from "react-icons/hi";
import {
	BsFillEmojiSmileFill,
	BsFillHeartFill,
	BsFillStarFill,
	BsFillHandThumbsUpFill,
	BsFillBellFill,
} from "react-icons/bs";
import { useState, useRef, ButtonHTMLAttributes } from "react";
import { IconWithSVG } from "../../general/Buttons";
import clsx from "clsx";

const emojiIcons = [
	FaSmileBeam,
	FaHeart,
	FaStar,
	FaThumbsUp,
	FaBell,
	GoSmiley,
	GoHeartFill,
	GoStarFill,
	GoThumbsup,
	GoBellFill,
	HiEmojiHappy,
	HiHeart,
	HiStar,
	HiThumbUp,
	HiBell,
	BsFillEmojiSmileFill,
	BsFillHeartFill,
	BsFillStarFill,
	BsFillHandThumbsUpFill,
	BsFillBellFill,
];

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	open?: boolean;
};

export const AddReactionBtn = ({ className = "", open = false, ...rest }: BtnProps) => {
	const [selected, setSelected] = useState(0);
	const hasHovered = useRef(false);

	const handleHover = () => {
		if (open) return;
		if (hasHovered.current) return;
		hasHovered.current = true;

		setSelected((prev) => (prev + 1) % emojiIcons.length);

		setTimeout(() => {
			hasHovered.current = false;
		}, 200);
	};

	const Icon = emojiIcons[selected];

	return (
		<IconWithSVG onMouseEnter={handleHover} {...rest} className={`icon-chatbox group bg-transparent ${className}`}>
			<Icon
				className={clsx(
					"text-xl text-yellow-400",
					!open &&
						"text-xl scale-100 group-hover:scale-[1.2] group-hover:rotate-[1deg] animate-pop transition-all duration-150 ease-in-out"
				)}
			/>
		</IconWithSVG>
	);
};
