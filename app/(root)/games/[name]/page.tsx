import GameContainer from "@/app/ui/games/GameContainer";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import React from "react";

export default async function Page({ params }: { params: Promise<{ name: string }> }) {
	const session = await auth();
	if (!session) redirect("/login");

	const { name } = await params;

	return <GameContainer name={name} user={session.user}></GameContainer>;
}
