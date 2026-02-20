import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = "https://cjrpeyrqetdgmcrcprok.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcnBleXJxZXRkZ21jcmNwcm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTQ2ODUsImV4cCI6MjA4NzEzMDY4NX0.Pb1XfQ-gDKZfXleDW6aObWviSXY-s1lgB3KOdi0pYYo";

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
