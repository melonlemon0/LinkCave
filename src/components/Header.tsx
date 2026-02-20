"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex-shrink-0 z-20 flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-black/5">
      <Link href="/" className="flex items-center gap-2 text-moo-dark hover:opacity-80 transition-opacity">
        <img src="/ha.png" alt="" className="h-8 w-auto object-contain" />
        <span className="font-semibold text-lg tracking-tight">Link Cave</span>
      </Link>
      <button
        type="button"
        onClick={signOut}
        className="text-sm text-moo-brown hover:text-moo-dark transition-colors"
      >
        Sign out
      </button>
    </header>
  );
}
