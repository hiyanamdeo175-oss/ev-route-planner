import { createClient } from "@supabase/supabase-js";

// ✅ Use Vite environment variables (must start with VITE_)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("❌ Supabase URL or Key missing. Check your .env file!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;


