import { getUserForProfilePage } from "@/app/lib/actions";
import DashboardPage from "@/app/ui/DashboardPage";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const session = await auth();
	if (!session?.user) throw new Error("Something went wrong. Please try again.");
	if (session.user.id === id) redirect("/dashboard");
	const user = await getUserForProfilePage(id);
	if (!user) {
		throw new Error(`User not found []`);
	}
	return <DashboardPage initialUser={user} isOwnPage={false} />;
}
