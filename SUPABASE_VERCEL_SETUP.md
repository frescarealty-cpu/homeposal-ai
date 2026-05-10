# Supabase + Vercel env vars (admin fix)

The **Legacy** keys are required for the current Supabase JS client.

## In Supabase

1. **Settings** → **API Keys**.
2. Open the **"Legacy anon, service_role API keys"** tab (not "Publishable and secret API keys").
3. Copy:
   - **Project URL** (at the top of that tab) → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon** (public) key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (secret; click reveal) → use for `SUPABASE_SERVICE_ROLE_KEY`

If there is no Project URL on that tab, use: `https://YOUR_PROJECT_ID.supabase.co` (Project ID is under Settings → General).

## In Vercel

**Settings** → **Environment Variables**. Add (or fix) for **Production** (and Preview if you use it):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Legacy tab or `https://<project-id>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy **anon** key (long JWT string) |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy **service_role** key (long JWT string) |

- No quotes, no extra spaces.
- **Critical:** `NEXT_PUBLIC_*` vars are baked in at **build time**. You must **Redeploy** after adding or changing them (Deployments → ⋮ → **Redeploy**). Old deployments will keep the old/missing values.
- Ensure each variable is checked for **Production** (and **Preview** if you use preview URLs).

## If you only have "Publishable and secret" keys

The new **Secret** key may not work with the current client. Use the **Legacy anon, service_role API keys** tab; if it’s missing, your project may need to have legacy keys enabled (see Supabase docs or support).
