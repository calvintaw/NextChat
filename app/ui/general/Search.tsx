import React from "react";
import InputField from "../form/InputField";
import { IoSearch } from "react-icons/io5";
import { IconWithSVG } from "./Buttons";

const Search = () => {
	return (
		<form action="" className="w-full">
			<InputField
				icon={
					<IconWithSVG className="icon-small">
						<IoSearch />
					</IconWithSVG>
				}
				name="friend"
				type="text"
				place="right"
				placeholder="Search friends"
			></InputField>
		</form>
	);
};

export default Search;
