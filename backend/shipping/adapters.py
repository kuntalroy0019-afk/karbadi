"""Courier adapter layer (Module 1).

Every courier exposes the same interface so the smart engine and the rest
of the app never branch on the vendor:

    serviceability(pincode, cod, weight) -> {serviceable, eta_days, cod_available, rate, ...}
    book(payload)                        -> {awb, label_url, charge}
    cancel(awb, ref)                     -> bool
    track(awb)                           -> {status, events: [...]}

Two implementations per courier:
  * Mock*  — deterministic, offline, used while USE_MOCK_COURIERS=true (default).
  * Real   — live REST clients (Shiprocket fully implemented to its public v1
             external API; Shree Maruti implemented to a token+REST contract that
             matches their API portal — confirm exact paths/fields against the
             docs the client provides, per quotation assumption #1).

The `book()` payload is built by shipping.engine._order_to_payload() and contains:
    order_number, order_date, payment_method ('cod'|'prepaid'), cod (bool),
    sub_total (float), weight_kg, dims {length,breadth,height},
    pickup {location,pincode,city,state},
    consignee {name, phone, line1, line2, city, state, pincode},
    items [{name, sku, units, price}]
"""
import logging
import re
from datetime import datetime, timedelta, timezone

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger("karbadi.shipping")

DEFAULT_TIMEOUT = 20


def _cfg():
    return settings.KARBADI


def _hash_int(text: str, mod: int) -> int:
    """Deterministic pseudo-value from a string (no randomness — replayable)."""
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h % mod


# =========================================================================
# Base
# =========================================================================
class BaseCourierAdapter:
    code = "base"
    name = "Base Courier"
    supports_cod = True
    base_eta = 4
    base_rate = 60

    def serviceability(self, pincode: str, cod: bool = False, weight: float = 1.0) -> dict:
        raise NotImplementedError

    def book(self, payload: dict) -> dict:
        raise NotImplementedError

    def cancel(self, awb: str, ref: str = "") -> bool:
        raise NotImplementedError

    def track(self, awb: str) -> dict:
        raise NotImplementedError


# =========================================================================
# Mock adapters (offline, deterministic)
# =========================================================================
class _MockMixin:
    def serviceability(self, pincode: str, cod: bool = False, weight: float = 1.0) -> dict:
        pincode = (pincode or "000000").strip()
        non_serviceable = pincode.endswith("999")  # exercise fallback path
        eta = self.base_eta + _hash_int(self.code + pincode, 4)
        rate = self.base_rate + _hash_int(pincode + self.code, 50) + (weight - 1) * 10
        return {
            "courier": self.code,
            "serviceable": not non_serviceable,
            "eta_days": eta,
            "cod_available": self.supports_cod and not pincode.endswith("000"),
            "rate": float(rate),
        }

    def book(self, payload: dict) -> dict:
        seed = f"{self.code}{payload.get('order_number', '')}"
        awb = f"{self.code[:3].upper()}{_hash_int(seed, 9_000_000) + 1_000_000}"
        # Honour the rate quoted at checkout so the estimate matches the charge.
        charge = payload.get("rate")
        if charge is None:
            charge = self.base_rate + _hash_int(seed, 40)
        return {
            "awb": awb,
            "label_url": f"https://mock.karbadi.local/labels/{awb}.pdf",
            "charge": float(charge),
        }

    def cancel(self, awb: str, ref: str = "") -> bool:
        return True

    def track(self, awb: str) -> dict:
        base = datetime(2026, 1, 1, tzinfo=timezone.utc)
        steps = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"]
        reached = _hash_int(awb, len(steps)) + 1
        events = []
        for i, st in enumerate(steps[:reached]):
            events.append({
                "status": st,
                "location": ["Hub", "Sort Center", "Transit", "Local Facility", "Destination"][i],
                "note": st.replace("_", " ").title(),
                "timestamp": (base + timedelta(days=i)).isoformat(),
            })
        return {"status": steps[reached - 1], "events": events}


class MockShiprocketAdapter(_MockMixin, BaseCourierAdapter):
    code = "shiprocket"
    name = "Shiprocket"
    base_eta = 3
    base_rate = 70


class MockShreeMarutiAdapter(_MockMixin, BaseCourierAdapter):
    code = "shree_maruti"
    name = "Shree Maruti Courier"
    base_eta = 4
    base_rate = 55


# =========================================================================
# Real: Shiprocket  (apiv2.shiprocket.in/v1/external)
# =========================================================================
# Maps Shiprocket tracking status codes/strings to our canonical statuses.
_SR_STATUS_MAP = {
    "NEW": "created",
    "PICKUP SCHEDULED": "pickup_scheduled",
    "PICKUP GENERATED": "pickup_scheduled",
    "PICKED UP": "picked_up",
    "IN TRANSIT": "in_transit",
    "OUT FOR DELIVERY": "out_for_delivery",
    "DELIVERED": "delivered",
    "RTO INITIATED": "failed",
    "CANCELED": "cancelled",
    "CANCELLED": "cancelled",
}


def _canonical(status: str) -> str:
    return _SR_STATUS_MAP.get((status or "").strip().upper(), "in_transit")


class ShiprocketAdapter(BaseCourierAdapter):
    code = "shiprocket"
    name = "Shiprocket"
    supports_cod = True
    _TOKEN_CACHE_KEY = "karbadi:shiprocket:token"

    @property
    def base(self):
        return _cfg()["SHIPROCKET"]["BASE_URL"].rstrip("/")

    # --- auth (token cached ~9 days; Shiprocket tokens last 10) ----------
    def _token(self) -> str:
        token = cache.get(self._TOKEN_CACHE_KEY)
        if token:
            return token
        creds = _cfg()["SHIPROCKET"]
        if not creds["EMAIL"] or not creds["PASSWORD"]:
            raise RuntimeError("SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD not configured.")
        resp = requests.post(
            f"{self.base}/auth/login",
            json={"email": creds["EMAIL"], "password": creds["PASSWORD"]},
            timeout=DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        token = resp.json()["token"]
        cache.set(self._TOKEN_CACHE_KEY, token, timeout=60 * 60 * 24 * 9)
        return token

    def _headers(self):
        return {"Authorization": f"Bearer {self._token()}", "Content-Type": "application/json"}

    def _get(self, path, **params):
        r = requests.get(f"{self.base}{path}", headers=self._headers(),
                         params=params or None, timeout=DEFAULT_TIMEOUT)
        r.raise_for_status()
        return r.json()

    def _post(self, path, body):
        r = requests.post(f"{self.base}{path}", headers=self._headers(),
                          json=body, timeout=DEFAULT_TIMEOUT)
        r.raise_for_status()
        return r.json()

    # --- serviceability + rate ------------------------------------------
    def serviceability(self, pincode, cod=False, weight=1.0):
        pickup = _cfg()["PICKUP"]["PINCODE"]
        try:
            data = self._get(
                "/courier/serviceability/",
                pickup_postcode=pickup,
                delivery_postcode=pincode,
                cod=1 if cod else 0,
                weight=weight,
            )
        except requests.HTTPError as exc:
            logger.warning("Shiprocket serviceability failed: %s", exc)
            return {"courier": self.code, "serviceable": False}

        companies = (data.get("data") or {}).get("available_courier_companies") or []
        if not companies:
            return {"courier": self.code, "serviceable": False}
        # Pick Shiprocket's cheapest serviceable option as the representative quote.
        best = min(companies, key=lambda c: float(c.get("rate", 1e9)))
        return {
            "courier": self.code,
            "serviceable": True,
            "eta_days": int(float(best.get("estimated_delivery_days") or best.get("etd_days") or 4)),
            "cod_available": str(best.get("cod", 1)) in ("1", "True", "true"),
            "rate": float(best.get("rate", self.base_rate)),
            "courier_company_id": best.get("courier_company_id"),
        }

    # --- booking: create adhoc order -> assign AWB -> label --------------
    def book(self, payload):
        order_body = self._build_order(payload)
        created = self._post("/orders/create/adhoc", order_body)
        shipment_id = created.get("shipment_id")
        if not shipment_id:
            raise RuntimeError(f"Shiprocket order create returned no shipment_id: {created}")

        assign = self._post("/courier/assign/awb", {"shipment_id": shipment_id})
        awb_data = (assign.get("response") or {}).get("data") or {}
        awb = awb_data.get("awb_code") or assign.get("awb_code")
        charge = float(awb_data.get("freight_charges") or payload.get("rate") or self.base_rate)

        label_url = ""
        try:
            label = self._post("/courier/generate/label", {"shipment_id": [shipment_id]})
            label_url = label.get("label_url", "")
        except requests.HTTPError:
            pass  # label is best-effort; tracking still works

        if not awb:
            raise RuntimeError(f"Shiprocket AWB assignment failed: {assign}")
        return {"awb": awb, "label_url": label_url, "charge": charge,
                "shipment_id": shipment_id, "order_id": created.get("order_id")}

    def _build_order(self, p):
        c = p["consignee"]
        pickup = p["pickup"]
        items = p.get("items") or [{"name": "Auto part", "sku": "KB-ITEM",
                                    "units": 1, "price": p.get("sub_total", 0)}]
        return {
            "order_id": p["order_number"],
            "order_date": p.get("order_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "pickup_location": pickup["location"],
            "billing_customer_name": c["name"],
            "billing_last_name": "",
            "billing_address": c["line1"],
            "billing_address_2": c.get("line2", ""),
            "billing_city": c["city"],
            "billing_pincode": c["pincode"],
            "billing_state": c["state"],
            "billing_country": "India",
            "billing_email": c.get("email", "buyer@karbadi.in"),
            "billing_phone": c["phone"],
            "shipping_is_billing": True,
            "order_items": [
                {"name": it["name"], "sku": it.get("sku", "KB-ITEM"),
                 "units": it["units"], "selling_price": it["price"]}
                for it in items
            ],
            "payment_method": "COD" if p.get("cod") else "Prepaid",
            "sub_total": p.get("sub_total", 0),
            "length": p["dims"]["length"],
            "breadth": p["dims"]["breadth"],
            "height": p["dims"]["height"],
            "weight": p.get("weight_kg", 1),
        }

    def cancel(self, awb, ref=""):
        # ref carries the Shiprocket order_id when available.
        try:
            if ref:
                self._post("/orders/cancel", {"ids": [int(ref)]})
            else:
                self._post("/orders/cancel/shipment/awbs", {"awbs": [awb]})
            return True
        except requests.HTTPError as exc:
            logger.warning("Shiprocket cancel failed: %s", exc)
            return False

    def track(self, awb):
        data = self._get(f"/courier/track/awb/{awb}")
        td = data.get("tracking_data") or {}
        activities = td.get("shipment_track_activities") or []
        events = []
        for a in activities:
            events.append({
                "status": _canonical(a.get("status") or a.get("sr-status-label")),
                "location": a.get("location", ""),
                "note": a.get("activity", ""),
                "timestamp": _parse_dt(a.get("date")),
            })
        track_list = td.get("shipment_track") or [{}]
        current = _canonical(track_list[0].get("current_status", ""))
        return {"status": current, "events": events}


# =========================================================================
# Real: Shree Maruti Courier
# =========================================================================
# Shree Maruti's API portal uses an API key (+ optional client id) and JSON
# REST endpoints. Exact paths/field names below follow the contract their
# integration docs publish; confirm against the docs the client supplies and
# adjust the *_PATH constants / field reads in one place if they differ.
class ShreeMarutiAdapter(BaseCourierAdapter):
    code = "shree_maruti"
    name = "Shree Maruti Courier"
    supports_cod = True

    SERVICEABILITY_PATH = "/api/v1/serviceability"
    BOOK_PATH = "/api/v1/shipments"
    TRACK_PATH = "/api/v1/track"
    CANCEL_PATH = "/api/v1/shipments/cancel"

    @property
    def base(self):
        return _cfg()["SHREE_MARUTI"]["BASE_URL"].rstrip("/")

    def _headers(self):
        creds = _cfg()["SHREE_MARUTI"]
        if not creds["API_KEY"]:
            raise RuntimeError("SHREE_MARUTI_API_KEY not configured.")
        h = {"Authorization": f"Bearer {creds['API_KEY']}", "Content-Type": "application/json"}
        if creds.get("CLIENT_ID"):
            h["X-Client-Id"] = creds["CLIENT_ID"]
        return h

    def serviceability(self, pincode, cod=False, weight=1.0):
        pickup = _cfg()["PICKUP"]["PINCODE"]
        try:
            r = requests.get(
                f"{self.base}{self.SERVICEABILITY_PATH}",
                headers=self._headers(),
                params={"origin": pickup, "destination": pincode,
                        "payment_mode": "cod" if cod else "prepaid", "weight": weight},
                timeout=DEFAULT_TIMEOUT,
            )
            r.raise_for_status()
            d = r.json()
        except requests.HTTPError as exc:
            logger.warning("Shree Maruti serviceability failed: %s", exc)
            return {"courier": self.code, "serviceable": False}

        if not d.get("serviceable", d.get("is_serviceable", False)):
            return {"courier": self.code, "serviceable": False}
        return {
            "courier": self.code,
            "serviceable": True,
            "eta_days": int(d.get("eta_days") or d.get("tat") or 4),
            "cod_available": bool(d.get("cod_available", cod)),
            "rate": float(d.get("rate") or d.get("freight") or self.base_rate),
        }

    def book(self, payload):
        c = payload["consignee"]
        pickup = payload["pickup"]
        body = {
            "reference_no": payload["order_number"],
            "payment_mode": "cod" if payload.get("cod") else "prepaid",
            "cod_amount": payload.get("sub_total", 0) if payload.get("cod") else 0,
            "weight": payload.get("weight_kg", 1),
            "dimensions": payload["dims"],
            "pickup": {
                "pincode": pickup["pincode"], "city": pickup["city"], "state": pickup["state"],
            },
            "consignee": {
                "name": c["name"], "phone": c["phone"],
                "address": f"{c['line1']} {c.get('line2', '')}".strip(),
                "city": c["city"], "state": c["state"], "pincode": c["pincode"],
            },
            "items": payload.get("items", []),
        }
        try:
            r = requests.post(f"{self.base}{self.BOOK_PATH}", headers=self._headers(),
                              json=body, timeout=DEFAULT_TIMEOUT)
            r.raise_for_status()
            d = r.json()
        except requests.HTTPError as exc:
            raise RuntimeError(f"Shree Maruti booking failed: {exc}")
        awb = d.get("awb") or d.get("waybill") or d.get("tracking_number")
        if not awb:
            raise RuntimeError(f"Shree Maruti booking returned no AWB: {d}")
        return {
            "awb": awb,
            "label_url": d.get("label_url", ""),
            "charge": float(d.get("freight") or d.get("rate") or payload.get("rate") or self.base_rate),
        }

    def cancel(self, awb, ref=""):
        try:
            r = requests.post(f"{self.base}{self.CANCEL_PATH}", headers=self._headers(),
                              json={"awb": awb}, timeout=DEFAULT_TIMEOUT)
            r.raise_for_status()
            return True
        except requests.HTTPError as exc:
            logger.warning("Shree Maruti cancel failed: %s", exc)
            return False

    def track(self, awb):
        try:
            r = requests.get(f"{self.base}{self.TRACK_PATH}/{awb}",
                             headers=self._headers(), timeout=DEFAULT_TIMEOUT)
            r.raise_for_status()
            d = r.json()
        except requests.HTTPError as exc:
            logger.warning("Shree Maruti track failed: %s", exc)
            return {"status": "in_transit", "events": []}
        scans = d.get("scans") or d.get("history") or d.get("events") or []
        events = []
        for s in scans:
            events.append({
                "status": _canonical(s.get("status") or s.get("status_code")),
                "location": s.get("location", s.get("city", "")),
                "note": s.get("remarks", s.get("activity", "")),
                "timestamp": _parse_dt(s.get("timestamp") or s.get("date") or s.get("scan_time")),
            })
        current = _canonical(d.get("current_status") or d.get("status") or "")
        return {"status": current, "events": events}


def _parse_dt(value):
    """Best-effort parse of courier timestamps -> ISO 8601 string."""
    if not value:
        return datetime.now(timezone.utc).isoformat()
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d %H:%M:%S", "%d-%m-%Y %H:%M:%S", "%Y-%m-%dT%H:%M:%S",
                    "%d %b %Y %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(value[:19], fmt).replace(tzinfo=timezone.utc).isoformat()
            except ValueError:
                continue
        # Already ISO-ish? hand it back; the view's fromisoformat handles it.
        return re.sub(r"\s+", "T", value.strip(), count=1)
    return datetime.now(timezone.utc).isoformat()


# =========================================================================
# Factory
# =========================================================================
def get_adapter(code: str) -> BaseCourierAdapter:
    use_mock = _cfg()["USE_MOCK_COURIERS"]
    registry = {
        "shiprocket": MockShiprocketAdapter if use_mock else ShiprocketAdapter,
        "shree_maruti": MockShreeMarutiAdapter if use_mock else ShreeMarutiAdapter,
    }
    cls = registry.get(code)
    if not cls:
        raise ValueError(f"Unknown courier code: {code}")
    return cls()
