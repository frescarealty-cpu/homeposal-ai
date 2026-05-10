"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthNav() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Link
      href={isLoggedIn ? "/profile" : "/login"}
      className="rounded-lg p-3 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--border-subtle)] hover:text-[var(--foreground)]"
      aria-label={isLoggedIn ? "Profile" : "Sign in"}
    >
      <User className="h-5 w-5" />
    </Link>
  );
}
