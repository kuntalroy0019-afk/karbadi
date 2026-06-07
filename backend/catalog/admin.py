from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import (
    Brand,
    Category,
    Part,
    PartImage,
    VehicleImage,
    VehicleListing,
)


def _thumb(image, fallback_text="?"):
    if image:
        return format_html(
            '<img src="{}" style="height:44px;width:44px;border-radius:8px;object-fit:cover"/>', image.url
        )
    return format_html(
        '<div style="height:44px;width:44px;border-radius:8px;background:#E8F0FF;'
        'display:flex;align-items:center;justify-content:center;color:#1565FF;font-weight:700">{}</div>',
        fallback_text[:1],
    )


class PartImageInline(TabularInline):
    model = PartImage
    extra = 1
    fields = ("image", "preview", "is_primary")
    readonly_fields = ("preview",)

    @display(description="Preview")
    def preview(self, obj):
        return _thumb(obj.image)


class VehicleImageInline(TabularInline):
    model = VehicleImage
    extra = 1
    fields = ("image", "preview", "is_primary")
    readonly_fields = ("preview",)

    @display(description="Preview")
    def preview(self, obj):
        return _thumb(obj.image)


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ("name", "slug", "order", "part_total")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)
    ordering = ("order",)

    @display(description="Parts")
    def part_total(self, obj):
        return obj.parts.count()


@admin.register(Brand)
class BrandAdmin(ModelAdmin):
    list_display = ("logo_preview", "name", "is_oem")
    list_display_links = ("logo_preview", "name")
    list_filter = ("is_oem",)
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)

    @display(description="Logo")
    def logo_preview(self, obj):
        return _thumb(obj.logo, obj.name)


@admin.register(Part)
class PartAdmin(ModelAdmin):
    list_display = ("image_preview", "title", "show_condition", "category", "price_display",
                    "stock_badge", "is_active", "is_featured", "created_at")
    list_display_links = ("image_preview", "title")
    list_filter = ("condition", "is_active", "is_featured", "category", "brand")
    list_editable = ("is_active", "is_featured")
    search_fields = ("title", "oem_part_number", "seller__username", "compatible_vehicles")
    autocomplete_fields = ("seller", "category", "brand")
    readonly_fields = ("views", "created_at", "discount_display")
    date_hierarchy = "created_at"
    list_filter_submit = True
    list_per_page = 25
    inlines = [PartImageInline]
    fieldsets = (
        ("Listing", {"fields": ("seller", "title", "slug", "description", "category", "brand")}),
        ("Specs", {"fields": ("condition", "oem_part_number", "compatible_vehicles", "weight_kg")}),
        ("Pricing & stock", {"fields": (("price", "mrp", "discount_display"), "stock", ("is_active", "is_featured"))}),
        ("Stats", {"fields": ("views", "created_at")}),
    )

    @display(description="")
    def image_preview(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return _thumb(img.image if img else None, obj.title)

    @display(description="Condition", label={"new": "success", "used": "warning"})
    def show_condition(self, obj):
        return obj.condition

    @display(description="Price")
    def price_display(self, obj):
        return format_html("<b>₹{}</b>", f"{obj.price:,.0f}")

    @display(description="Discount")
    def discount_display(self, obj):
        return f"{obj.discount_percent}%"

    @display(description="Stock", label=True)
    def stock_badge(self, obj):
        return f"{obj.stock} left"


@admin.register(VehicleListing)
class VehicleListingAdmin(ModelAdmin):
    list_display = ("image_preview", "title", "year", "show_fuel", "km_driven", "price_display", "is_sold", "is_active")
    list_display_links = ("image_preview", "title")
    list_filter = ("fuel_type", "is_sold", "is_active", "year", "brand")
    list_editable = ("is_sold",)
    search_fields = ("title", "model_name", "city", "registration_number", "seller__username")
    autocomplete_fields = ("seller", "brand")
    date_hierarchy = "created_at"
    inlines = [VehicleImageInline]

    @display(description="")
    def image_preview(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        return _thumb(img.image if img else None, obj.title)

    @display(description="Fuel", label=True)
    def show_fuel(self, obj):
        return obj.fuel_type

    @display(description="Price")
    def price_display(self, obj):
        return format_html("<b>₹{}</b>", f"{obj.price:,.0f}")
