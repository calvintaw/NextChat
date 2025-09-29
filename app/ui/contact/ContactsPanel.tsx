import { getContacts, getFriendRequests } from "@/app/lib/actions";
import { auth } from "@/auth";
import ContactTabs from "./ContactsTabs";
import { redirect } from "next/navigation";

export default async function ContactPanel() {
	const session = await auth();
	if (!session) redirect("/login");

	const currentUser = session.user;
	const [contacts, requests] = await Promise.all([getContacts(currentUser.id), getFriendRequests(currentUser.id)]);

	return <ContactTabs user={currentUser} initialFriendRequests={requests} initialContacts={contacts}></ContactTabs>;
}
