# Conditional Access System for Property Bidding

## Overview

This document describes the technical plan for public vs. authenticated access to property proposals, including a `proposals` table, restricted public view, and protected proposal submission.

---

## 1. Data Requirements

### PUBLIC VIEW (No Login Required)

- Users can view a **list of proposals** on any property page.
- **Display ONLY**:
  - Offer Date
  - Price
  - Financing Type
  - Closing Date
- **Never exposed**: bidder name, contact info, user_id, status, full_notes

### AUTHENTICATED ACTION (Login Required)

- Users must be logged in to "Submit a Proposal."
- If a logged-out user clicks "Make Proposal," redirect to `/login` (with return URL).
- Protected server action validates session before inserting into `proposals`.

---

## 2. Auth Choice: Supabase Auth

Using **Supabase Auth** (already in stack). Benefits:
- Single backend (Supabase) for DB + Auth
- Row Level Security (RLS) for fine-grained access
- `auth.uid()` for session validation in server actions and RLS
- No extra auth provider dependency

---

## 3. Database Schema

### `proposals` Table

| Column           | Type         | Access  | Description                          |
|------------------|--------------|---------|--------------------------------------|
| id               | UUID         | -       | Primary key                          |
| property_id      | UUID         | -       | FK → properties                      |
| user_id          | UUID         | Private | FK → auth.users (bidder)             |
| offer_amount_cents | BIGINT     | Public  | Price                                |
| financing_type   | TEXT         | Public  | e.g. 'cash', 'conventional', 'fha'   |
| closing_date     | DATE         | Public  | Desired closing date                 |
| status           | TEXT         | Private | pending, accepted, rejected, etc.    |
| full_notes       | TEXT         | Private | Bidder notes (never shown publicly)  |
| created_at       | TIMESTAMPTZ  | Public  | Used as "Offer Date"                 |

### Public View / API Contract

For any public read of proposals, return only:

```ts
{
  id: string;
  offerDate: string;    // ISO date from created_at
  priceCents: number;
  financingType: string;
  closingDate: string;  // ISO date
}
```

---

## 4. Technical Implementation

### 4.1 Supabase RLS Policies

- **proposals (SELECT, public)**: Allow anonymous read of a restricted view (or use a Postgres function/view that returns only public columns).
- **proposals (INSERT)**: Require `auth.uid() IS NOT NULL` and `auth.uid() = user_id`.
- **proposals (UPDATE/DELETE)**: Only `user_id = auth.uid()` for own proposals.

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Property Page (/property/[id])                                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ProposalsPublicView (no auth)                                           │
│    → Fetches /api/properties/[id]/proposals                              │
│    → API uses Supabase anon key + SELECT on public view or filtered cols │
│    → Returns: offerDate, price, financingType, closingDate               │
├─────────────────────────────────────────────────────────────────────────┤
│  Place Proposal Button / Form                                            │
│    → If NOT logged in: Link to /login?redirect=/property/[id]            │
│    → If logged in: Show form → submitProposal server action              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 API / Server Components

| Route / Action            | Auth   | Purpose                                      |
|---------------------------|--------|----------------------------------------------|
| GET /api/properties/[id]/proposals | None   | Return public proposal fields for property   |
| submitProposal (Server Action)     | Required | Insert proposal (validates session)        |
| /login, /signup           | None   | Auth pages, redirect back after sign-in     |

### 4.4 Components

- **ProposalsPublicView**: Renders table with Offer Date, Price, Financing Type, Closing Date only.
- **PlaceOfferForm**: Wraps in auth check; if unauthenticated, renders "Sign in to submit proposal" with link to `/login?redirect=...`.

---

## 5. Files to Create / Modify

| File | Action |
|------|--------|
| `supabase/migrations/001_proposals.sql` | Create proposals table + RLS + public view |
| `src/lib/supabase/server.ts` | Supabase server client (cookies) |
| `src/lib/supabase/client.ts` | Supabase browser client |
| `src/lib/actions/submitProposal.ts` | Protected server action |
| `src/components/ProposalsPublicView.tsx` | Restricted public view component |
| `src/components/PlaceOfferForm.tsx` | Auth check, redirect, extended form fields |
| `src/app/login/page.tsx` | Login page |
| `src/app/signup/page.tsx` | Signup page |
| `src/app/api/properties/[id]/proposals/route.ts` | Public API for proposals |
| `src/app/property/[id]/page.tsx` | Use ProposalsPublicView, pass auth state |

---

## 6. Security Checklist

- [ ] RLS enabled on `proposals`; public SELECT limited to public columns
- [ ] Server action `submitProposal` calls `getUser()` and returns early if null
- [ ] API route for proposals returns only public fields (never user_id, full_notes, status)
- [ ] Login redirect preserves `redirect` query param for post-auth navigation
