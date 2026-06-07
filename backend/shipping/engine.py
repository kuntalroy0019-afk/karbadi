"""Smart auto-select best courier engine (Module 2).

Pipeline:
  1. Pincode serviceability check across all active couriers.
  2. ETA fetch + COD + rate from each serviceable courier.
  3. Smart scoring (fastest ETA, COD support, rate, reliability, admin rules).
  4. Fallback auto-switch if the top courier later fails to book.

`quote_couriers()` powers the checkout "confidence display".
`auto_select_and_book()` is called by checkout to create the Shipment.
"""
from datetime import datetime, timezone
from decimal import Decimal

from .adapters import get_adapter
from .models import Courier, CourierRule, Shipment, TrackingEvent

# Scoring weights (sum need not be 1; relative magnitude is what matters).
W_ETA = 40        # faster is better
W_RATE = 20       # cheaper is better
W_RELIABILITY = 25
W_COD = 10        # COD requested & supported
W_RULE = 30       # admin priority rule bonus


def _rule_bonus(courier_code: str, pincode: str) -> int:
    """Highest matching admin rule priority for this courier+pincode."""
    best = 0
    rules = CourierRule.objects.filter(courier__code=courier_code)
    for rule in rules:
        if not rule.pincode_prefix or pincode.startswith(rule.pincode_prefix):
            best = max(best, rule.priority)
    return best


def quote_couriers(pincode: str, cod: bool = False, weight_kg: float = 1.0) -> list:
    """Return scored, ranked courier options for a destination pincode."""
    couriers = Courier.objects.filter(is_active=True)
    quotes = []
    for courier in couriers:
        adapter = get_adapter(courier.code)
        try:
            svc = adapter.serviceability(pincode, cod=cod, weight=weight_kg)
        except NotImplementedError:
            continue
        except Exception as exc:  # a live courier API hiccup shouldn't kill the quote
            from logging import getLogger
            getLogger("karbadi.shipping").warning("%s serviceability error: %s", courier.code, exc)
            continue
        if not svc.get("serviceable"):
            quotes.append({
                "courier_code": courier.code,
                "courier_name": courier.name,
                "serviceable": False,
                "score": -1,
            })
            continue
        if cod and not svc.get("cod_available"):
            # COD requested but unsupported -> not eligible.
            quotes.append({
                "courier_code": courier.code,
                "courier_name": courier.name,
                "serviceable": True,
                "cod_available": False,
                "eligible": False,
                "score": -1,
            })
            continue
        quotes.append({
            "courier_code": courier.code,
            "courier_name": courier.name,
            "serviceable": True,
            "eligible": True,
            "eta_days": svc["eta_days"],
            # Adapter rate is already weight-inclusive (real APIs price by weight;
            # the mock factors it in too) — don't add a weight surcharge again.
            "rate": svc["rate"],
            "cod_available": svc["cod_available"],
            "reliability": float(courier.reliability),
            "rule_bonus": _rule_bonus(courier.code, pincode),
        })

    eligible = [q for q in quotes if q.get("eligible")]
    if eligible:
        max_eta = max(q["eta_days"] for q in eligible) or 1
        max_rate = max(q["rate"] for q in eligible) or 1
        for q in eligible:
            eta_score = W_ETA * (1 - q["eta_days"] / max_eta)
            rate_score = W_RATE * (1 - q["rate"] / max_rate)
            rel_score = W_RELIABILITY * q["reliability"]
            cod_score = W_COD if (cod and q["cod_available"]) else 0
            rule_score = min(W_RULE, q["rule_bonus"])
            q["score"] = round(eta_score + rate_score + rel_score + cod_score + rule_score, 2)
            q["score_breakdown"] = {
                "eta": round(eta_score, 1),
                "rate": round(rate_score, 1),
                "reliability": round(rel_score, 1),
                "cod": cod_score,
                "rule": rule_score,
            }

    quotes.sort(key=lambda q: q.get("score", -1), reverse=True)
    return quotes


def auto_select_and_book(order, courier_override: str = None) -> Shipment:
    """Pick the best courier for an order and create + book the shipment.

    Falls back to the next-best courier if the top choice fails to book.
    """
    cod = order.payment_method == order.Payment.COD
    weight = float(sum((i.quantity for i in order.items.all()), 0)) or 1.0
    quotes = quote_couriers(order.ship_pincode, cod=cod, weight_kg=weight)
    ranked = [q for q in quotes if q.get("eligible")]

    if courier_override:
        ranked.sort(key=lambda q: 0 if q["courier_code"] == courier_override else 1)

    if not ranked:
        raise RuntimeError("No courier services this pincode for the chosen payment method.")

    last_error = None
    for choice in ranked:
        courier = Courier.objects.get(code=choice["courier_code"])
        adapter = get_adapter(courier.code)
        payload = _order_to_payload(order, cod=cod, weight=weight, rate=choice.get("rate"))
        try:
            booking = adapter.book(payload)
        except NotImplementedError as exc:
            last_error = exc
            continue
        except Exception as exc:  # live API failure -> try the next courier (fallback)
            last_error = exc
            from logging import getLogger
            getLogger("karbadi.shipping").warning("%s booking failed: %s", courier.code, exc)
            continue

        shipment = Shipment.objects.create(
            order=order,
            courier=courier,
            awb=booking["awb"],
            courier_ref=str(booking.get("order_id") or booking.get("shipment_id") or ""),
            status=Shipment.Status.CREATED,
            shipping_charge=booking["charge"],
            estimated_delivery_days=choice["eta_days"],
            label_url=booking.get("label_url", ""),
            selection_reason={
                "chosen": courier.code,
                "score": choice["score"],
                "breakdown": choice.get("score_breakdown", {}),
                "considered": [
                    {"courier": q["courier_code"], "score": q.get("score")}
                    for q in quotes
                ],
                "fallback_used": choice is not ranked[0],
            },
        )
        TrackingEvent.objects.create(
            shipment=shipment,
            status=Shipment.Status.CREATED,
            location="Karbadi Seller Hub",
            note="Shipment booked",
            timestamp=datetime.now(timezone.utc),
        )
        # Fold the shipping charge into the order total.
        order.shipping_fee = Decimal(str(booking["charge"]))
        order.recalc()
        order.status = order.Status.CONFIRMED
        order.save(update_fields=["shipping_fee", "items_total", "grand_total", "status"])
        return shipment

    raise RuntimeError(f"All couriers failed to book: {last_error}")


def _order_to_payload(order, cod: bool, weight: float, rate=None) -> dict:
    """Build the vendor-agnostic booking payload every adapter consumes."""
    from django.conf import settings

    pickup = settings.KARBADI["PICKUP"]
    items = [
        {
            "name": it.title,
            "sku": (it.part.oem_part_number or f"KB-{it.part_id}") if it.part else f"KB-{it.id}",
            "units": it.quantity,
            "price": float(it.unit_price),
        }
        for it in order.items.all()
    ]
    return {
        "order_number": order.order_number,
        "order_date": order.created_at.strftime("%Y-%m-%d") if order.created_at else None,
        "payment_method": order.payment_method,
        "cod": cod,
        "rate": rate,
        "sub_total": float(order.items_total or 0),
        "weight_kg": max(0.5, float(weight)),
        "dims": {"length": 15, "breadth": 15, "height": 10},  # default parcel box (cm)
        "pickup": {
            "location": pickup["LOCATION"],
            "pincode": pickup["PINCODE"],
            "city": pickup["CITY"],
            "state": pickup["STATE"],
        },
        "consignee": {
            "name": order.ship_full_name,
            "phone": order.ship_phone,
            "line1": order.ship_line1,
            "line2": order.ship_line2,
            "city": order.ship_city,
            "state": order.ship_state,
            "pincode": order.ship_pincode,
            "email": getattr(order.buyer, "email", "") or "buyer@karbadi.in",
        },
        "items": items,
    }
