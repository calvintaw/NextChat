import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Create a channel with a descriptive topic name
export const channel = supabase.channel("room:lobby:messages", {
	config: { private: true }, // Recommended for production
});