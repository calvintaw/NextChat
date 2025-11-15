"use client";
import { useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { useFriendsProvider } from "@/app/lib/contexts/friendsContext";

type Props = {
	userId: string;
};

const SupabasePresence = ({ userId }: Props) => {
	const { contacts, setContacts } = useFriendsProvider();

	useEffect(() => {
		if (!userId) return;

		const channel = supabase.channel("online_users", {
			config: { presence: { key: userId } },
		});

		const handleSync = () => {
			const state = channel.presenceState();
			setContacts((prev) =>
				prev.map((p) => ({
					...p,
					online: Boolean(state[p.id]),
				}))
			);
		};

		const handleJoin = ({ key }: { key: string }) => {
			if (!contacts.some((f) => f.id === key)) return;
			setContacts((prev) => prev.map((p) => (p.id === key ? { ...p, online: true } : p)));
		};

		const handleLeave = ({ key }: { key: string }) => {
			if (!contacts.some((f) => f.id === key)) return;
			setContacts((prev) => prev.map((p) => (p.id === key ? { ...p, online: false } : p)));
		};

		channel.on("presence", { event: "sync" }, handleSync);
		channel.on("presence", { event: "join" }, handleJoin);
		channel.on("presence", { event: "leave" }, handleLeave);

		channel.subscribe(async (status) => {
			console.log("[Presence status]", status);
			if (status === "SUBSCRIBED") {
				await channel.track({ status: "online", online_at: new Date().toISOString() });
			}
		});

		return () => {
			channel.untrack();
			channel.unsubscribe();
		};
	}, [userId]);

	return null;
};

export default SupabasePresence;
