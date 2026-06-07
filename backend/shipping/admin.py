from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import Courier, CourierRule, Shipment, TrackingEvent

_SHIP_LABELS = {
    "created": "info", "pickup_scheduled": "info", "picked_up": "info",
    "in_transit": "info", "out_for_delivery": "warning",
    "delivered": "success", "failed": "danger", "cancelled": "danger",
}


class TrackingEventInline(TabularInline):
    model = TrackingEvent
    extra = 0
    ordering = ("-timestamp",)
    readonly_fields = ("status", "location", "note", "timestamp")
    can_delete = False


class CourierRuleInline(TabularInline):
    model = CourierRule
    extra = 1


@admin.register(Courier)
class CourierAdmin(ModelAdmin):
    list_display = ("logo_preview", "name", "code", "is_active", "supports_cod", "reliability_bar")
    list_display_links = ("logo_preview", "name")
    list_editable = ("is_active",)
    search_fields = ("name", "code")
    inlines = [CourierRuleInline]

    @display(description="")
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:32px;border-radius:6px"/>', obj.logo.url)
        return format_html('<span class="material-symbols-outlined" style="color:#1565FF">local_shipping</span>')

    @display(description="Reliability")
    def reliability_bar(self, obj):
        pct = int(float(obj.reliability) * 100)
        return format_html(
            '<div style="background:#E8F0FF;border-radius:6px;width:90px;height:8px;overflow:hidden">'
            '<div style="background:#1565FF;height:8px;width:{}%"></div></div><small>{}%</small>',
            pct, pct,
        )


@admin.register(CourierRule)
class CourierRuleAdmin(ModelAdmin):
    list_display = ("courier", "pincode_prefix", "priority", "note")
    list_filter = ("courier",)
    list_editable = ("priority",)
    search_fields = ("pincode_prefix", "note")


@admin.register(Shipment)
class ShipmentAdmin(ModelAdmin):
    list_display = ("awb", "order", "courier", "show_status", "charge_display", "eta_display", "created_at")
    list_filter = ("status", "courier")
    search_fields = ("awb", "order__order_number", "courier_ref")
    date_hierarchy = "created_at"
    readonly_fields = ("selection_reason_pretty", "created_at", "updated_at", "label_link")
    autocomplete_fields = ("order",)
    inlines = [TrackingEventInline]
    list_filter_submit = True
    fieldsets = (
        ("Shipment", {"fields": ("order", "courier", ("awb", "courier_ref"), "status")}),
        ("Delivery", {"fields": (("shipping_charge", "estimated_delivery_days"), "label_link")}),
        ("Smart selection", {"fields": ("selection_reason_pretty",)}),
        ("Timestamps", {"fields": (("created_at", "updated_at"),)}),
    )

    @display(description="Status", label=_SHIP_LABELS)
    def show_status(self, obj):
        return obj.status

    @display(description="Charge")
    def charge_display(self, obj):
        return f"₹{obj.shipping_charge:,.0f}"

    @display(description="ETA")
    def eta_display(self, obj):
        return f"{obj.estimated_delivery_days} days"

    @display(description="Label")
    def label_link(self, obj):
        if obj.label_url:
            return format_html('<a href="{}" target="_blank" class="text-primary-600">Download label ↗</a>', obj.label_url)
        return "—"

    @display(description="Why this courier?")
    def selection_reason_pretty(self, obj):
        r = obj.selection_reason or {}
        if not r:
            return "—"
        considered = "".join(
            f"<li>{c.get('courier')}: score {c.get('score')}</li>"
            for c in r.get("considered", [])
        )
        return format_html(
            "<div><b>Chosen:</b> {} (score {})<br><b>Fallback used:</b> {}<br>"
            "<b>Considered:</b><ul style='margin:4px 0 0 16px'>{}</ul></div>",
            r.get("chosen", "?"), r.get("score", "?"),
            "yes" if r.get("fallback_used") else "no",
            format_html(considered),
        )
