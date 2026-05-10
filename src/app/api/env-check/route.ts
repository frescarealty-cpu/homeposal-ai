import { NextResponse } from "next/server";

/**
 * Temporary diagnostic: GET /api/env-check
 * Returns which Supabase env vars are present (no values).
 * Remove or restrict this in production once debugging is done.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const check = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: !!process.env.ADMIN_EMAILS,
  };
  return NextResponse.json(check);
}
