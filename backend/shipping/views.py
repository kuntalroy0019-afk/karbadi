from datetime import datetime, timezone

from django.shortcuts import get_object_or_404
from rest_framework import permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .adapters import get_adapter
from .engine import quote_couriers
from .models import Courier, CourierRule, Shipment, TrackingEvent
from .serializers import (
    CourierRuleSerializer,
    CourierSerializer,
    ServiceabilityQuerySerializer,
    ShipmentSerializer,
)

# Map adapter statuses -> our order status transitions.
_STATUS_TO_ORDER = {
    "picked_up": "shipped",
    "in_transit": "shipped",
    "out_for_delivery": "shipped",
    "delivered": "delivered",
}


class CourierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Courier.objects.filter(is_active=True)
    serializer_class = CourierSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CourierRuleViewSet(viewsets.ModelViewSet):
    """Admin config panel for smart-select priority rules (Module 2)."""
    queryset = CourierRule.objects.select_related("courier").all()
    serializer_class = CourierRuleSerializer
    permission_classes = [permissions.IsAdminUser]


class ServiceabilityView(APIView):
    """Checkout 'confidence display': ranked courier options for a pincode."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        q = ServiceabilityQuerySerializer(data=request.query_params)
        q.is_valid(raise_exception=True)
        data = q.validated_data
        quotes = quote_couriers(
            data["pincode"], cod=data["cod"], weight_kg=data["weight_kg"]
        )
        recommended = next((x for x in quotes if x.get("eligible")), None)
        return Response({
            "pincode": data["pincode"],
            "recommended": recommended,
            "options": quotes,
        })


class ShipmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Shipment.objects.select_related("courier", "order").prefetch_related("events")
        if user.is_staff:
            return qs
        # Buyers see their own; sellers see shipments for orders with their items.
        return qs.filter(order__buyer=user) | qs.filter(order__items__seller=user)

    @action(detail=True, methods=["get"])
    def track(self, request, pk=None):
        """Pull latest tracking from the courier adapter and persist events."""
        shipment = self.get_object()
        adapter = get_adapter(shipment.courier.code)
        try:
            result = adapter.track(shipment.awb)
        except NotImplementedError:
            return Response({"detail": "Live tracking not configured."}, status=501)

        for ev in result.get("events", []):
            ts = ev["timestamp"]
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            TrackingEvent.objects.get_or_create(
                shipment=shipment, status=ev["status"], timestamp=ts,
                defaults={"location": ev.get("location", ""), "note": ev.get("note", "")},
            )
        shipment.status = result.get("status", shipment.status)
        shipment.save(update_fields=["status"])
        self._sync_order_status(shipment)
        shipment.refresh_from_db()
        return Response(self.get_serializer(shipment).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        shipment = self.get_object()
        adapter = get_adapter(shipment.courier.code)
        try:
            adapter.cancel(shipment.awb, ref=shipment.courier_ref)
        except NotImplementedError:
            pass
        shipment.status = Shipment.Status.CANCELLED
        shipment.save(update_fields=["status"])
        return Response(self.get_serializer(shipment).data)

    @action(detail=True, methods=["get"])
    def label(self, request, pk=None):
        shipment = self.get_object()
        return Response({"awb": shipment.awb, "label_url": shipment.label_url})

    @staticmethod
    def _sync_order_status(shipment):
        new_order_status = _STATUS_TO_ORDER.get(shipment.status)
        if new_order_status:
            order = shipment.order
            order.status = new_order_status
            order.save(update_fields=["status"])


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def courier_webhook(request, courier_code):
    """Delivery webhook endpoint (Module 1).

    Couriers POST status updates here: {awb, status, location, note}.
    In production, verify a signature/secret per courier before trusting.
    """
    awb = request.data.get("awb")
    new_status = request.data.get("status")
    if not awb or not new_status:
        return Response({"detail": "awb and status required"}, status=400)
    shipment = get_object_or_404(Shipment, awb=awb, courier__code=courier_code)
    TrackingEvent.objects.create(
        shipment=shipment,
        status=new_status,
        location=request.data.get("location", ""),
        note=request.data.get("note", ""),
        timestamp=datetime.now(timezone.utc),
    )
    shipment.status = new_status
    shipment.save(update_fields=["status"])
    ShipmentViewSet._sync_order_status(shipment)
    return Response({"ok": True, "awb": awb, "status": new_status})
