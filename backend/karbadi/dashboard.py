"""Unfold admin dashboard — real KPIs computed from live data."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Sum
from django.utils import timezone


def _money(value):
    return "₹" + f"{Decimal(value or 0):,.0f}"


def dashboard_callback(request, context):
    """Inject KPI cards, charts and recent activity into the admin index."""
    from accounts.models import SellerProfile, User
    from catalog.models import Part, VehicleListing
    from oem.models import OemPart
    from orders.models import Inquiry, Order
    from shipping.models import Shipment

    now = timezone.now()
    last_30 = now - timedelta(days=30)

    orders = Order.objects.all()
    paid_or_confirmed = orders.exclude(status=Order.Status.CANCELLED)
    revenue = paid_or_confirmed.aggregate(t=Sum("grand_total"))["t"] or 0
    revenue_30 = (
        paid_or_confirmed.filter(created_at__gte=last_30).aggregate(t=Sum("grand_total"))["t"] or 0
    )

    # KPI cards
    kpis = [
        {"title": "Revenue (all time)", "value": _money(revenue),
         "icon": "payments", "footer": f"{_money(revenue_30)} in last 30 days"},
        {"title": "Orders", "value": orders.count(),
         "icon": "receipt_long",
         "footer": f"{orders.filter(created_at__gte=last_30).count()} in last 30 days"},
        {"title": "Active Parts", "value": Part.objects.filter(is_active=True).count(),
         "icon": "build", "footer": f"{OemPart.objects.count()} OEM catalogue entries"},
        {"title": "Sellers", "value": SellerProfile.objects.count(),
         "icon": "storefront",
         "footer": f"{User.objects.count()} total users"},
    ]

    # Orders by status (for a simple progress breakdown)
    status_rows = (
        orders.values("status").annotate(n=Count("id")).order_by("-n")
    )
    total_orders = orders.count() or 1
    order_status = [
        {
            "label": row["status"].title(),
            "count": row["n"],
            "percent": round(row["n"] / total_orders * 100),
        }
        for row in status_rows
    ]

    # Shipments by courier
    shipment_rows = (
        Shipment.objects.values("courier__name").annotate(n=Count("id")).order_by("-n")
    )
    shipments_by_courier = [
        {"label": row["courier__name"], "count": row["n"]} for row in shipment_rows
    ]

    # Recent orders table
    recent_orders = list(
        orders.select_related("buyer")
        .order_by("-created_at")[:8]
        .values("order_number", "status", "grand_total", "buyer__username", "created_at")
    )
    for o in recent_orders:
        o["grand_total"] = _money(o["grand_total"])

    context.update({
        "kpis": kpis,
        "order_status": order_status,
        "shipments_by_courier": shipments_by_courier,
        "recent_orders": recent_orders,
        "open_inquiries": Inquiry.objects.filter(status=Inquiry.Status.OPEN).count(),
        "low_stock": Part.objects.filter(is_active=True, stock__lte=2).count(),
        "vehicles_for_sale": VehicleListing.objects.filter(is_active=True, is_sold=False).count(),
    })
    return context
