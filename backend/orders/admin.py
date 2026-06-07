from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import Cart, CartItem, Inquiry, Order, OrderItem

_STATUS_LABELS = {
    "pending": "warning", "confirmed": "info", "packed": "info",
    "shipped": "info", "delivered": "success", "cancelled": "danger",
}


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("part", "seller", "title", "unit_price", "quantity", "line_total_display")
    can_delete = False

    @display(description="Line total")
    def line_total_display(self, obj):
        return f"₹{obj.line_total:,.0f}"


class CartItemInline(TabularInline):
    model = CartItem
    extra = 0
    autocomplete_fields = ("part",)


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ("order_number", "buyer", "show_status", "payment_badge", "grand_total_display", "is_paid", "created_at")
    list_filter = ("status", "payment_method", "is_paid")
    search_fields = ("order_number", "buyer__username", "ship_pincode", "ship_full_name")
    date_hierarchy = "created_at"
    readonly_fields = ("order_number", "items_total", "grand_total", "created_at", "updated_at")
    autocomplete_fields = ("buyer",)
    inlines = [OrderItemInline]
    list_filter_submit = True
    list_per_page = 25
    fieldsets = (
        ("Order", {"fields": ("order_number", "buyer", ("status", "payment_method", "is_paid"))}),
        ("Shipping address", {"fields": ("ship_full_name", "ship_phone", "ship_line1", "ship_line2",
                                         ("ship_city", "ship_state", "ship_pincode"))}),
        ("Totals", {"fields": (("items_total", "shipping_fee", "grand_total"), ("created_at", "updated_at"))}),
    )

    @display(description="Status", label=_STATUS_LABELS)
    def show_status(self, obj):
        return obj.status

    @display(description="Payment", label={"cod": "warning", "prepaid": "success"})
    def payment_badge(self, obj):
        return obj.payment_method

    @display(description="Total")
    def grand_total_display(self, obj):
        return format_html("<b>₹{}</b>", f"{obj.grand_total:,.0f}")


@admin.register(Cart)
class CartAdmin(ModelAdmin):
    list_display = ("user", "item_count", "subtotal_display", "created_at")
    search_fields = ("user__username",)
    autocomplete_fields = ("user",)
    inlines = [CartItemInline]

    @display(description="Subtotal")
    def subtotal_display(self, obj):
        return f"₹{obj.subtotal:,.0f}"


@admin.register(Inquiry)
class InquiryAdmin(ModelAdmin):
    list_display = ("id", "buyer", "seller", "subject", "show_status", "created_at")
    list_filter = ("status",)
    search_fields = ("buyer__username", "seller__username", "message")
    autocomplete_fields = ("buyer", "seller", "part", "vehicle")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)

    @display(description="About")
    def subject(self, obj):
        if obj.part_id:
            return obj.part.title
        if obj.vehicle_id:
            return obj.vehicle.title
        return "—"

    @display(description="Status", label={"open": "warning", "answered": "success", "closed": "info"})
    def show_status(self, obj):
        return obj.status
