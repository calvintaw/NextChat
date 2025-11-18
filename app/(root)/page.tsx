import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFriendRequests } from "../lib/actions";
import ContactTabs from "../ui/contact/ContactsTabs";

const Page = async () => {
	const session = await auth();
	if (!session) redirect("/login");

	const currentUser = session.user;

	const requests = await getFriendRequests(currentUser.id);
	return (
		<section className="flex gap-2 flex-col flex-1">
			<ContactTabs user={currentUser} initialFriendRequests={requests}></ContactTabs>{" "}
		</section>
	);
};

export default Page;

// import React from "react";

// const page = () => {
// 	return <div>page</div>;
// };

// export default page;
