# Property Offer Marketplace — Implementation Plan

## Overview
A Kalshi-style property offer marketplace with high information density, natural language search, and an interactive map. Built with Next.js (App Router), Tailwind CSS, Supabase, and Mapbox.

---

## Database Schema (Supabase/PostgreSQL)

### 1. `profiles`
Extends Supabase auth.users. Stores user preferences and settings.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. `properties`
Main property listings with offer-window metadata.

```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Property specs
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL,
  square_feet INTEGER,
  lot_size_sqft INTEGER,
  year_built INTEGER,
  property_type TEXT, -- 'condo', 'single_family', 'townhouse', etc.
  
  -- Listing details
  description TEXT,
  image_urls TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}', -- pool, garage, etc.
  
  -- Offer market state
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed', 'sold')),
  list_price_cents BIGINT NOT NULL,
  offer_deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For vector search (optional)
  search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_deadline ON properties(offer_deadline);
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN(search_vector);
```

### 3. `offers`
Individual offers/bids placed on properties. Similar to Kalshi "orders."

```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Offer terms
  offer_amount_cents BIGINT NOT NULL,
  offer_type TEXT DEFAULT 'buy' CHECK (offer_type IN ('buy', 'counter')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_property ON offers(property_id);
CREATE INDEX idx_offers_user ON offers(user_id);
CREATE INDEX idx_offers_status ON offers(status);
```

### 4. `order_book_aggregates` (Materialized View or Real-time)
For fast display of "Current Best Offer" and offer counts per property.

```sql
-- Best offer per property (for grid display)
CREATE VIEW best_offers AS
SELECT 
  property_id,
  MAX(offer_amount_cents) FILTER (WHERE status = 'pending') AS best_offer_cents,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_offer_count
FROM offers
GROUP BY property_id;
```

---

## Implementation Phases

### Phase 1: Layout & Theme
- [ ] Initialize Next.js (App Router) + Tailwind + Lucide + Supabase
- [ ] Create Kalshi-inspired CSS theme (thin borders, monospace numbers, status badges)
- [ ] Main navigation with dark/light mode toggle
- [ ] Typography: Inter (body), JetBrains Mono (currency/numbers)
- [ ] Color palette: Slate-900, Emerald-500, Rose-500

### Phase 2: Map & Search
- [ ] Mapbox component (left 60%, placeholder API key)
- [ ] Property list on right 40% (market grid cards)
- [ ] AI-style search bar: large, centered, subtle animations
- [ ] Property pins on map, click → highlight in list

### Phase 3: Property Detail & Offer Logic
- [ ] Property detail page with specs and Order Book UI
- [ ] Order Book: Yes/No style sidebar (best offers, pending count)
- [ ] Place offer form → update Order Book in real-time
- [ ] Supabase integration for auth and data

---

## Tech Stack

| Layer       | Technology                      |
|------------|----------------------------------|
| Framework  | Next.js 14+ (App Router)        |
| Styling    | Tailwind CSS                    |
| Icons      | Lucide React                    |
| Backend    | Supabase (Auth, DB, Realtime)   |
| Map        | Mapbox GL JS                    |
| Search     | Supabase full-text / Vector (optional: Algolia) |

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
```
