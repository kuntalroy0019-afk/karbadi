from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from .models import (
    Fitment,
    OemPart,
    RegistrationLookup,
    VehicleMake,
    VehicleModel,
)


class FitmentInline(TabularInline):
    model = Fitment
    extra = 1
    autocomplete_fields = ("vehicle_model",)


class VehicleModelInline(TabularInline):
    model = VehicleModel
    extra = 1


@admin.register(VehicleMake)
class VehicleMakeAdmin(ModelAdmin):
    list_display = ("logo_preview", "name", "country", "model_count")
    list_display_links = ("logo_preview", "name")
    search_fields = ("name",)
    inlines = [VehicleModelInline]

    @display(description="Logo")
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:36px;border-radius:6px"/>', obj.logo.url)
        return "—"

    @display(description="Models")
    def model_count(self, obj):
        return obj.models.count()


@admin.register(VehicleModel)
class VehicleModelAdmin(ModelAdmin):
    list_display = ("name", "make", "year_start", "year_end")
    list_filter = ("make",)
    search_fields = ("name", "make__name")
    autocomplete_fields = ("make",)


@admin.register(OemPart)
class OemPartAdmin(ModelAdmin):
    list_display = ("image_preview", "oem_number", "name", "category", "mrp_display", "fitment_count", "source", "synced_at")
    list_display_links = ("image_preview", "oem_number")
    search_fields = ("oem_number", "name", "description")
    list_filter = ("category", "source")
    autocomplete_fields = ("category",)
    readonly_fields = ("synced_at",)
    inlines = [FitmentInline]
    list_filter_submit = True

    @display(description="")
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;width:40px;border-radius:8px;object-fit:cover"/>', obj.image.url)
        return format_html('<div style="height:40px;width:40px;border-radius:8px;background:#E8F0FF;display:flex;align-items:center;justify-content:center;color:#1565FF">⚙</div>')

    @display(description="MRP")
    def mrp_display(self, obj):
        return f"₹{obj.mrp:,.0f}" if obj.mrp else "—"

    @display(description="Fits", label=True)
    def fitment_count(self, obj):
        return f"{obj.compatible_models.count()} models"


@admin.register(RegistrationLookup)
class RegistrationLookupAdmin(ModelAdmin):
    list_display = ("prefix", "vehicle_model", "year", "fuel_type")
    search_fields = ("prefix",)
    list_filter = ("fuel_type",)
    autocomplete_fields = ("vehicle_model",)
