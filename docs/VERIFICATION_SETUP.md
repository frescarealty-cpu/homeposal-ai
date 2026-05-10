# Email Verification Setup

## Supabase Configuration

**Disable Supabase's built-in email confirmation** so our custom verification flow is used:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers** → **Email**
3. Set **"Confirm email"** to **OFF**

This allows users to sign in immediately after registration. Our app checks `is_verified` on the profile and blocks unverified users from logging in and submitting proposals until they verify via our email link.

## Resend Configuration

1. Sign up at [resend.com](https://resend.com)
2. Add your domain and verify it (or use `onboarding@resend.dev` for testing)
3. Create an API key
4. Add to `.env.local`:

```
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=HomePosal <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yoursite.com
```

Without `RESEND_API_KEY`, the verification link is logged to the console in development.
