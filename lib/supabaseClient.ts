import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't let a missing env var crash the whole build/render — log clearly
  // instead. Real Supabase calls will fail until the env vars are set
  // correctly in Vercel (or .env.local for local dev), but the app itself
  // will still load so you can see this message instead of a blank error.
  console.warn(
    "Supabase env vars are missing. In Vercel: Project → Settings → Environment Variables, add " +
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy. " +
    "Locally: copy .env.example to .env.local and fill them in."
  );
}

// createClient() requires a well-formed URL even as a placeholder, or it throws
// at import time and takes down every page that imports this file (including
// during Vercel's build step). Falling back to a dummy URL keeps the build
// alive; real data calls will simply fail with a clear Supabase error until
// the real env vars are in place.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
