# 🚗 Karbadi — Every Car, Every Part

India's auto-parts marketplace connecting workshops, spare-part dealers, retailers and
vehicle owners for **New & Used Auto Parts** — plus whole-vehicle buy/sell, OEM catalogue
search, smart courier delivery and order tracking.

## ⚡ Quickstart (clone & run)

```bash
git clone https://github.com/kuntalroy0019-afk/karbadi.git
cd karbadi

# 1) Backend
python -m venv backend_venv
backend_venv/Scripts/pip install -r backend/requirements.txt    # macOS/Linux: backend_venv/bin/pip
cd backend
../backend_venv/Scripts/python manage.py migrate
../backend_venv/Scripts/python manage.py seed                   # demo data + logins
../backend_venv/Scripts/python manage.py runserver 0.0.0.0:8000

# 2) Buyer app           # 3) Vendor app
cd ../mobile             cd ../vendor
npm install              npm install
npx expo start           npx expo start
```

Point each app at the backend in its `src/config.ts` (or `EXPO_PUBLIC_API_URL`).
Copy `backend/.env.example` → `backend/.env` to add Cloudinary / courier / OEM keys.
**Production:** set `DJANGO_DEBUG=false` and a real `DJANGO_SECRET_KEY` (the app refuses to
boot without one), plus `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.

Built from scratch:

| Layer | Stack |
|-------|-------|
| **Backend** | Django 5 + Django REST Framework + SimpleJWT (SQLite dev / Postgres-ready) |
| **Admin**   | django-unfold (modern Tailwind admin) + custom KPI dashboard |
| **Media**   | Cloudinary (auto-enabled with credentials; local fallback otherwise) |
| **Buyer app** | Expo (React Native) + TypeScript — `mobile/` (Android & iOS) |
| **Vendor app** | Separate Expo seller/partner app — `vendor/` (manage storefront, listings, sales, inquiries) |
| **Tests**   | 99 tests across all apps (`python manage.py test`) |

---

## ✨ Features

**Marketplace (buyer app)**
- New & Used part listings, categories (Body / Mechanical / Electric / Sensors / Accessories)
- OEM sellers, best sellers, seller storefronts with ratings
- Whole-vehicle Buy / Sell listings
- Full-text search, featured products, cart, COD / prepaid checkout
- Buyer ⇄ seller inquiries
- JWT auth (buyer / seller / admin roles), Django admin panel

**Vendor / seller experience** — available **two ways**:
1. Lightweight seller screens inside the buyer app (Account → Seller Dashboard).
2. A **dedicated standalone vendor app** in [`vendor/`](vendor/README.md) — the
   industry-standard "partner app" pattern, with its own seller branding and login:
   - Dashboard (revenue, sales, active listings, pending, low-stock & inquiry alerts)
   - Listings management + create/edit with **multi-image upload** (→ Cloudinary)
   - Sales (orders with the seller's items) + order detail
   - Inquiry replies
   - Storefront editor (shop details, GSTIN, address, logo upload)

**Module 1 — Courier integration** (`shipping/`)
- Pluggable adapter layer for **Shiprocket** + **Shree Maruti** (mock providers work offline;
  drop in real credentials to go live)
- Shipment booking, cancel, shipping-label URL, live tracking timeline
- Delivery webhook endpoint that syncs order status

**Module 2 — Smart auto-select best courier** (`shipping/engine.py`)
- Pincode serviceability across all couriers
- ETA + COD + rate fetch, weighted **scoring algorithm**
- Admin-configurable priority rules (e.g. Shiprocket for metros, Shree Maruti for Tier-2/3)
- Fallback auto-switch when the primary courier can't serve
- Checkout "confidence display" so customers see courier, ETA & COD before paying

**Module 3 — OEM catalogue** (`oem/`)
- Make → Model → Year drill-down part finder
- OEM part-number / name global search
- **Search by vehicle registration number** → auto-detect make/model → compatible parts
- Cross-match each OEM part to **live seller listings** on Karbadi
- Catalogue sync scheduler entrypoint

---

## 📁 Layout

```
Karbadi/
├── backend/            Django REST API
│   ├── karbadi/        settings, root urls
│   ├── accounts/       users, roles, seller profiles, addresses, JWT
│   ├── catalog/        categories, brands, parts, vehicle listings  (+ seed command)
│   ├── oem/            OEM make/model/year, parts, reg-no lookup, cross-match
│   ├── orders/         cart, orders, checkout, inquiries
│   └── shipping/       couriers, adapters, smart engine, shipments, tracking, webhooks
├── mobile/             Buyer app — Expo React Native (browse, OEM finder, cart, checkout, tracking)
│   └── src/
│       ├── api/        axios client (JWT refresh) + typed endpoints
│       ├── context/    Auth + Cart providers
│       ├── components/ design-system UI, PartCard, TopBar
│       ├── navigation/ tab + stack navigators
│       ├── screens/    buyer + lightweight seller screens
│       └── theme.ts    Karbadi design tokens
├── vendor/             Vendor app — standalone Expo seller/partner app (see vendor/README.md)
│   └── src/            dashboard, listings+form, sales, inquiries, storefront editor
└── backend_venv/       Python virtualenv
```

---

## 🚀 Run it

### 1. Backend

```bash
cd backend
# venv already created at ../backend_venv
../backend_venv/Scripts/python.exe manage.py migrate      # (already done)
../backend_venv/Scripts/python.exe manage.py seed         # demo data
../backend_venv/Scripts/python.exe manage.py runserver 0.0.0.0:8000
```

> On macOS/Linux use `source ../backend_venv/bin/activate` then plain `python manage.py …`.
> To recreate the venv from scratch: `python -m venv backend_venv && backend_venv/Scripts/pip install -r backend/requirements.txt`

API root: http://localhost:8000/ · Admin: http://localhost:8000/admin/

**Demo logins** (from `seed`):

| Role   | Username  | Password     |
|--------|-----------|--------------|
| Buyer  | `buyer`   | `buyer12345` |
| Seller | `autohub` | `seller12345` (also `partszone`, `kiaoem`) |
| Admin  | `admin`   | `admin12345` |

### 2. Mobile

```bash
cd mobile
npm install        # already installed
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR with **Expo Go**.

**Point the app at your backend** — edit `mobile/src/config.ts`:
- Android emulator → `http://10.0.2.2:8000`
- iOS simulator / web → `http://localhost:8000`
- **Physical device (Expo Go)** → `http://<YOUR-LAN-IP>:8000` (detected: `192.168.31.84`)

Or set `EXPO_PUBLIC_API_URL` in your shell before `expo start`.

---

## 🔌 Going live with the integrations

By default everything runs against **deterministic mock providers**, so the whole flow
(checkout → smart courier select → booking → tracking, and OEM reg-no lookup) works
with zero external accounts.

### Couriers — real adapters are implemented

`shipping/adapters.py` ships **live REST clients**, not stubs:

- **`ShiprocketAdapter`** — fully implemented against Shiprocket's public
  `v1/external` API: token auth (cached ~9 days), `courier/serviceability`,
  `orders/create/adhoc` → `courier/assign/awb` → `courier/generate/label`,
  `courier/track/awb`, and order cancel. Status codes are mapped to Karbadi's
  canonical shipment states.
- **`ShreeMarutiAdapter`** — implemented to a token + JSON-REST contract
  (serviceability / book / track / cancel). The endpoint paths are defined as
  constants at the top of the class — confirm them against the API docs the
  courier provides (quotation assumption #1) and tweak in that one place if needed.

To go live, copy `backend/.env.example` → `backend/.env`, fill the keys, set your
Shiprocket **pickup location** name, and flip the flag:

```env
USE_MOCK_COURIERS=false
PICKUP_LOCATION=Primary        # must match a pickup location in your Shiprocket dashboard
PICKUP_PINCODE=400001
SHIPROCKET_EMAIL=...      SHIPROCKET_PASSWORD=...
SHREE_MARUTI_API_KEY=...  SHREE_MARUTI_CLIENT_ID=...
```

No other code changes — the smart engine, checkout, tracking and webhooks all call
couriers through the same interface. If a courier API is unreachable or a key is
missing, the engine logs it, **falls back** to the next courier, and (if none can
ship) still places the order with a `shipping_warning` rather than failing checkout.

### OEM (Oriparts)

`USE_MOCK_OEM=false` + `ORIPARTS_API_KEY` activates the real branch in
`oem/services.py → sync_catalogue()` (marked `NotImplementedError`, ready to fill
against the Oriparts data feed).

### Images — Cloudinary

Every `ImageField` (part photos, vehicle photos, brand/category icons, OEM part
images, seller logos, avatars) routes through Cloudinary in production. It turns
on automatically when credentials are present — set **either**:

```env
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
# …or the three discrete vars:
CLOUDINARY_CLOUD_NAME=...  CLOUDINARY_API_KEY=...  CLOUDINARY_API_SECRET=...
```

Without credentials, uploads fall back to the local `MEDIA_ROOT`, so the project
still runs offline. No code or serializer changes are needed either way — the API
returns absolute image URLs in both modes.

---

## 🛠️ Admin panel

A fully redesigned admin built on **django-unfold** (Tailwind, dark-mode, mobile
friendly), branded in Karbadi blue, at `/admin/`:

- **Custom dashboard** with live KPIs — revenue (all-time + 30-day), order counts,
  active parts, sellers, orders-by-status bars, shipments-by-courier, recent orders,
  and alert tiles (open inquiries, low stock, vehicles for sale).
- Grouped sidebar navigation (Marketplace / OEM / Sales & Fulfilment / Accounts)
  with icons and a live "open inquiries" badge.
- Rich list views: image thumbnails, colored status/condition/payment badges,
  reliability bars, inline tracking events, the smart-courier "why this courier?"
  breakdown, inline images, autocomplete relations, date hierarchies and bulk filters.

---

## 🧪 Tests

87 tests covering every app — run them all:

```bash
cd backend
../backend_venv/Scripts/python.exe manage.py test          # or: python manage.py test
```

| App | What's covered |
|-----|----------------|
| `accounts` | registration rules, password hashing, JWT login/refresh, `me`, role-escalation guard, seller storefront promotion, address scoping & default toggling |
| `catalog`  | public listing, condition filter, search (title/OEM), inactive-hidden, ordering, view-count increment, featured, seller-only create, ownership enforcement, `my-listings`, vehicle filters |
| `oem`      | makes/models nesting, year expansion, vehicle drill-down, OEM search, compatible-vehicle listing, reg-no lookup (success + 404 + case/space-insensitive), cross-match (incl. case-insensitive) |
| `orders`   | cart add/increment/update/zero-remove/delete, auth guard, checkout (success, empty, missing address, totals, stock decrement, cart emptied, no-courier warning), order scoping, cancel rules, inquiries (auto-assign seller, reply permissions, visibility) |
| `shipping` | mock+real adapter factory, deterministic serviceability, scoring/ranking, metro rule, COD exclusion, smart booking, selection reason, courier override, **fallback**, no-courier raise, serviceability API, tracking, buyer scoping, webhook status sync, cancel, admin-only courier rules, quote==charge & no-double-weight regression tests |

Tests use a dependency-free factory module (`karbadi/testutils.py`) and run against
the mock courier/OEM providers, so they need no external services.

---

## 🔑 Key API endpoints

```
POST /api/auth/login/                       → JWT + user
POST /api/auth/register/
GET  /api/catalog/parts/?condition=new&search=…&category=…
GET  /api/catalog/parts/featured/
GET  /api/catalog/vehicles/
GET  /api/oem/makes/  ·  /api/oem/makes/{id}/models/
GET  /api/oem/parts/by-vehicle/?model=…&category=…
GET  /api/oem/parts/lookup-registration/?reg=MH12AB1234
GET  /api/oem/parts/{id}/                   → incl. cross-matched listings
POST /api/orders/cart-items/   ·  GET /api/orders/cart/
POST /api/orders/checkout/                  → auto-books smart courier
GET  /api/shipping/serviceability/?pincode=400001&cod=true
GET  /api/shipping/shipments/{id}/track/
POST /api/shipping/webhook/{courier_code}/  → delivery status updates
```

---

## ✅ Verified end-to-end

`login → browse → OEM reg-lookup → cross-match → add-to-cart → checkout →
smart courier auto-select (Shiprocket scored highest for a Mumbai pincode via the admin rule)
→ shipment booked + AWB → tracking timeline`, plus the non-serviceable-pincode fallback path.
TypeScript passes clean and the Android JS bundle exports without errors.
