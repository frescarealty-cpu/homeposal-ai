import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { AdminProposalsList } from "./AdminProposalsList";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isRedirectError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "digest" in err && String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT");
}

export default async function AdminPage() {
  try {
    // Check env vars first so we never throw and always show a clear message
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hasSupabaseUrl || !hasServiceRoleKey) {
      const missing = [
        !hasSupabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
        !hasServiceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean);
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
            <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              ← Back to Home
            </Link>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="font-medium text-[var(--foreground)]">Admin is not configured on this deployment</p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Missing: {missing.join(" and ")}. Add them in Vercel → Project → Settings → Environment Variables for
              <strong> Production</strong>, then redeploy (Deployments → ⋮ → Redeploy).
            </p>
          </div>
        </div>
      );
    }

    let supabase;
    try {
      supabase = await createClient();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Admin] createClient error:", err);
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
            <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← Back to Home</Link>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <p className="font-medium text-[var(--foreground)]">Could not connect to Supabase</p>
            <p className="mt-2 text-sm font-mono text-[var(--foreground-muted)]">{msg}</p>
          </div>
        </div>
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[Admin] auth.getUser error:", authError);
      return (
        <div className="mx-auto max-w-4xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
            <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← Back to Home</Link>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <p className="font-medium text-[var(--foreground)]">Auth error</p>
            <p className="mt-2 text-sm font-mono text-[var(--foreground-muted)]">{authError.message}</p>
          </div>
        </div>
      );
    }

    if (!user?.email) {
      redirect(`/login?redirect=${encodeURIComponent("/admin")}`);
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.length > 0 && adminEmails.includes(user.email.toLowerCase());
    if (!isAdmin) {
      redirect("/");
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Admin client failed";
    console.error("[Admin] createAdminClient error:", err);
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            ← Back to Home
          </Link>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-6 text-[var(--foreground)] dark:border-amber-800 dark:bg-amber-900/20">
          <p className="font-medium">Admin is not configured</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {msg.includes("Missing Supabase admin config")
              ? "Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in your deployment environment (e.g. Vercel → Settings → Environment Variables) to use the admin area."
              : msg}
          </p>
        </div>
      </div>
    );
  }

  try {
    const { data: proposals, error: proposalsError } = await adminClient
      .from("proposals")
      .select("id, property_id, user_id, status, offer_amount_cents, financing_type, closing_date, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, preferred_contact_method, desired_days_to_close, created_at")
      .in("status", ["pending", "approved", "withdrawn", "rejected"])
      .order("created_at", { ascending: false });

    if (proposalsError) {
      console.error("[Admin] proposals fetch error:", proposalsError);
      throw new Error(proposalsError.message);
    }

    const { data: placeProposals, error: placeProposalsError } = await adminClient
      .from("place_proposals")
      .select("id, place_address, place_lat, place_lng, user_id, status, offer_amount_cents, financing_type, closing_date, full_notes, loan_amount_cents, loan_type, down_payment_cents, proof_of_funds, prequal_letter, preferred_contact_method, desired_days_to_close, created_at")
      .in("status", ["pending", "approved", "withdrawn", "rejected"])
      .order("created_at", { ascending: false });

    if (placeProposalsError) {
      console.error("[Admin] place_proposals fetch error:", placeProposalsError);
      throw new Error(placeProposalsError.message);
    }

    const userIds = [
      ...new Set([
        ...(proposals ?? []).map((p) => p.user_id),
        ...(placeProposals ?? []).map((p) => p.user_id),
      ]),
    ];
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, phone, role")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

    if (profilesError) {
      console.error("[Admin] profiles fetch error:", profilesError);
      throw new Error(profilesError.message);
    }

    const profileByUserId: Record<string, { full_name: string; email: string | null; phone: string | null; role: string }> = {};
    for (const pr of profiles ?? []) {
      profileByUserId[pr.id] = { full_name: pr.full_name ?? "", email: pr.email ?? null, phone: pr.phone ?? null, role: pr.role ?? "" };
    }

    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
          <Link
            href="/"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="mb-6 text-sm text-[var(--foreground-muted)]">
          View and manage pending, active, and cancelled proposals. Filter by property ID, address, or user.
        </p>
        <AdminProposalsList
          proposals={proposals ?? []}
          placeProposals={placeProposals ?? []}
          profileByUserId={profileByUserId}
        />
      </div>
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load admin data";
    console.error("[Admin] data fetch error:", err);
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            ← Back to Home
          </Link>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-[var(--foreground)] dark:border-red-800 dark:bg-red-900/20">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{msg}</p>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            Check the server logs or Vercel function logs for details. Ensure SUPABASE_SERVICE_ROLE_KEY is set and that the database tables exist.
          </p>
        </div>
      </div>
    );
  }
  } catch (err) {
    if (isRedirectError(err)) throw err;
    const msg = err instanceof Error ? err.message : typeof err === "string" ? err : "An unexpected error occurred";
    console.error("[Admin] page error:", err);
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Admin: Proposals</h1>
          <Link href="/" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            ← Back to Home
          </Link>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-6 text-[var(--foreground)] dark:border-red-800 dark:bg-red-900/20">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{msg}</p>
          <p className="mt-2 text-xs text-[var(--foreground-muted)]">
            If the problem continues, ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your deployment environment.
          </p>
        </div>
      </div>
    );
  }
}
