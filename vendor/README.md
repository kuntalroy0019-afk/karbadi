# 🛒 Karbadi Seller — Vendor App

A **standalone seller/partner app** for the Karbadi auto-parts marketplace
(think "Swiggy Partner" alongside the consumer app). Sellers manage their
storefront, listings, sales and buyer inquiries here — separate from the
buyer app in [`../mobile`](../mobile), sharing the same Django backend.

Built with **Expo (React Native) + TypeScript**, distinct seller branding
(deep-navy header, emerald earnings accent).

## Features
- **Login required** (no guest mode); register creates a *seller* account.
- **Dashboard** — revenue, total sales, active listings, pending sales, open-inquiry
  & low-stock alerts, quick actions, recent sales.
- **Listings** — view all your parts (active + hidden), edit, toggle visibility,
  delete, with view counts.
- **Add / edit listing** — full form with **multi-image upload** (photos → Cloudinary
  via the backend), category, condition, price/MRP/stock, OEM number, compatibility.
- **Sales** — orders containing your items, buyer & shipment/courier info, order detail.
- **Inquiries** — reply to buyer questions inline.
- **Storefront** — edit shop name, description, GSTIN, address, and **upload a logo**;
  shows rating & OEM-verified badge; sign out.

## Run

```bash
cd vendor
npm install          # already installed
npx expo start
```

Press `a` (Android), `i` (iOS), or scan the QR with **Expo Go**. Make sure the
backend is running (see [`../backend`](../backend)) and point the app at it in
`src/config.ts` (or `EXPO_PUBLIC_API_URL`) — same host rules as the buyer app
(`10.0.2.2` for Android emulator, your LAN IP for a physical device).

**Demo seller logins** (from the backend `seed` command):

| Username   | Password     |
|------------|--------------|
| `autohub`  | `seller12345` |
| `partszone`| `seller12345` |
| `kiaoem`   | `seller12345` |

## How it talks to the backend
Reuses the existing API with seller-scoped endpoints:

```
POST /api/auth/login/                 seller signs in
GET  /api/auth/sellers/me/            fetch own storefront
PUT  /api/auth/sellers/me/            create/update storefront (+ logo upload)
GET  /api/catalog/parts/my-listings/  own listings (incl. hidden)
POST /api/catalog/parts/              create listing (multipart images → Cloudinary)
PATCH/DELETE /api/catalog/parts/{id}/ edit / toggle / delete (owner-only)
GET  /api/orders/orders/sales/        orders containing the seller's items
POST /api/orders/inquiries/{id}/reply/ answer a buyer
```

Storefront writes are protected by an **owner-only** object permission on the
backend (`IsProfileOwnerOrReadOnly`) — a seller can never edit another's shop.
