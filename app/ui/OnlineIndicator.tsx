// "use client";

// import { getSession } from "next-auth/react";
// import { useEffect } from "react";
// import { supabase } from "../lib/supabase";
// import { Session } from "next-auth";

// const OnlineIndicator = ({ session }: { session: Session | null }) => {
// 	useEffect(() => {
// 		if (!session) return;

// 		const channel = supabase.channel("online-users");

// 		const subscribePresence = async () => {
// 			await channel.subscribe();
// 			await channel.track({ userId: session.user.id, status: "online" });
// 		};

// 		subscribePresence();

// 		return () => {
// 			// Stop tracking when component unmounts
// 			channel.untrack();
// 			supabase.removeChannel(channel);
// 		};
// 	}, [session]);

// 	return null;
// };

// export default OnlineIndicator;
