"""Shipping: couriers, shipments, tracking events and smart-select config.

Module 1 — Shree Maruti + Shiprocket integration.
Module 2 — Smart auto-select best courier engine.
"""
from django.db import models


class Courier(models.Model):
    """A courier partner. Seeded with Shiprocket and Shree Maruti."""
    code = models.CharField(max_length=30, unique=True)  # 'shiprocket' | 'shree_maruti'
    name = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)
    supports_cod = models.BooleanField(default=True)
    # Reliability score (0-1) used by the smart scoring algorithm.
    reliability = models.DecimalField(max_digits=3, decimal_places=2, default=0.9)
    logo = models.ImageField(upload_to="couriers/", blank=True, null=True)

    def __str__(self):
        return self.name


class CourierRule(models.Model):
    """Admin-configurable priority rule (Module 2 admin config panel).

    e.g. prefer Shiprocket for Metro pincodes, Shree Maruti for Tier 2/3.
    A rule matches when the destination pincode starts with `pincode_prefix`
    (blank prefix = global default). Higher `priority` wins ties.
    """
    courier = models.ForeignKey(Courier, on_delete=models.CASCADE, related_name="rules")
    pincode_prefix = models.CharField(max_length=6, blank=True, default="")
    priority = models.IntegerField(default=0)
    note = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["-priority"]

    def __str__(self):
        return f"{self.courier.code} prefix='{self.pincode_prefix}' prio={self.priority}"


class Shipment(models.Model):
    class Status(models.TextChoices):
        CREATED = "created", "Created"
        PICKUP_SCHEDULED = "pickup_scheduled", "Pickup Scheduled"
        PICKED_UP = "picked_up", "Picked Up"
        IN_TRANSIT = "in_transit", "In Transit"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for Delivery"
        DELIVERED = "delivered", "Delivered"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    order = models.OneToOneField(
        "orders.Order", on_delete=models.CASCADE, related_name="shipment"
    )
    courier = models.ForeignKey(Courier, on_delete=models.PROTECT, related_name="shipments")
    awb = models.CharField(max_length=40, blank=True, help_text="Air waybill / tracking no.")
    courier_ref = models.CharField(max_length=60, blank=True, help_text="Courier-side order id (for cancel)")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    shipping_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_delivery_days = models.PositiveIntegerField(default=4)
    label_url = models.URLField(blank=True)
    # Audit of how the courier was chosen (smart scoring breakdown).
    selection_reason = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.awb or 'PENDING'} via {self.courier.code}"


class TrackingEvent(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name="events")
    status = models.CharField(max_length=20)
    location = models.CharField(max_length=120, blank=True)
    note = models.CharField(max_length=200, blank=True)
    timestamp = models.DateTimeField()

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.status} @ {self.location}"
