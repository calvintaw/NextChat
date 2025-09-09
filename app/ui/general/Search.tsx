import React from "react";
import InputField from "../form/InputField";
import { IoSearch } from "react-icons/io5";
import { IconWithSVG } from "./Buttons";

const Search = ({setInput}) => {
	return (
		<form action="" className="w-full">
			<InputField
				icon={
					<IconWithSVG className="icon-small">
						<IoSearch />
					</IconWithSVG>
				}
				onChange={(e) =>setInput(e.target.value)}
				name="friend"
				type="text"
				place="right"
				placeholder="Search friends"
				parentClassName="transition-none"
			
			></InputField>
		</form>
	);
};

export default Search;
