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

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const AddReactionBtn = ({ className = "", ...rest }: BtnProps) => {
	const [selected, setSelected] = useState(0);
	const hasHovered = useRef(false);

	const handleHover = () => {
		if (hasHovered.current) return; // prevent rapid re-entry
		hasHovered.current = true;

		setSelected((prev) => (prev + 1) % emojiIcons.length);

		// Reset hover lock after short delay
		setTimeout(() => {
			hasHovered.current = false;
		}, 200);
	};

	const Icon = emojiIcons[selected];

	return (
		<IconWithSVG onMouseEnter={handleHover} {...rest} className={`icon-chatbox group bg-transparent ${className}`}>
			<Icon className="text-xl scale-100 animate-pop text-yellow-400 group-hover:scale-[1.2] group-hover:rotate-[1deg] transition-all duration-150 ease-in-out" />
		</IconWithSVG>
	);
};
