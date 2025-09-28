import { getUserByUsername } from "@/app/lib/actions";
import DashboardPage from "@/app/ui/DashboardPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
	const { username } = await params;
	const session = await auth();
	if (!session?.user) throw new Error("Something went wrong. Please try again.");
	if (session.user.username === username) redirect("/dashboard");
	const user = await getUserByUsername(username);
	if (!user) {
		throw new Error(`User not found [DashboardPage: username=${username}]`);
	}
	return <DashboardPage initialUser={user} isOwnPage={false} />;
}
