import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SupabasePresence from "./SupabasePresence";

const SupabasePresenceWrapper = async () => {
const session = await auth();
  if (!session) redirect("/login");
  const user = session.user;
  return <SupabasePresence userId={user.id}></SupabasePresence>;
};

export default SupabasePresenceWrapper;
