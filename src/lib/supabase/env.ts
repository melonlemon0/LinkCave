/** Fallback when env vars aren't set (e.g. Netlify without env config). */
const FALLBACK_URL = "https://cjrpeyrqetdgmcrcprok.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcnBleXJxZXRkZ21jcmNwcm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTQ2ODUsImV4cCI6MjA4NzEzMDY4NX0.Pb1XfQ-gDKZfXleDW6aObWviSXY-s1lgB3KOdi0pYYo";

export function getSupabaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (typeof u === "string" && u.trim()) return u.trim();
  return FALLBACK_URL;
}

export function getSupabaseAnonKey(): string {
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof k === "string" && k.trim()) return k.trim();
  return FALLBACK_ANON_KEY;
}
