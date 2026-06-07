from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import Address, SellerProfile, User


@admin.register(User)
class KarbadiUserAdmin(DjangoUserAdmin, ModelAdmin):
    # Unfold-styled auth forms
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = ("username", "email", "show_role", "is_seller_approved", "is_staff", "date_joined")
    list_filter = ("role", "is_seller_approved", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name", "phone")
    ordering = ("-date_joined",)
    list_filter_submit = True

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Karbadi", {"fields": ("role", "phone", "avatar", "is_seller_approved")}),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Karbadi", {"fields": ("email", "role", "phone")}),
    )

    @display(description="Role", label={
        "buyer": "info", "seller": "success", "admin": "danger",
    })
    def show_role(self, obj):
        return obj.role


@admin.register(SellerProfile)
class SellerProfileAdmin(ModelAdmin):
    list_display = ("logo_preview", "shop_name", "user", "rating_stars", "is_oem", "is_best_seller", "city")
    list_display_links = ("logo_preview", "shop_name")
    list_filter = ("is_oem", "is_best_seller", "state")
    search_fields = ("shop_name", "user__username", "city", "gstin")
    autocomplete_fields = ("user",)
    list_filter_submit = True
    readonly_fields = ("logo_preview", "created_at")
    fieldsets = (
        ("Storefront", {"fields": ("user", "shop_name", "description", ("logo", "logo_preview"))}),
        ("Business", {"fields": ("gstin", "city", "state", "pincode", "is_oem")}),
        ("Reputation", {"fields": ("rating", "rating_count", "is_best_seller", "created_at")}),
    )

    @display(description="Logo")
    def logo_preview(self, obj):
        if obj.logo:
            return format_html('<img src="{}" style="height:38px;width:38px;border-radius:8px;object-fit:cover"/>', obj.logo.url)
        return format_html('<div style="height:38px;width:38px;border-radius:8px;background:#E8F0FF;display:flex;align-items:center;justify-content:center;color:#1565FF;font-weight:700">{}</div>', (obj.shop_name or "?")[:1])

    @display(description="Rating")
    def rating_stars(self, obj):
        full = int(float(obj.rating))
        return format_html('<span style="color:#FFB400">{}</span> {}', "★" * full + "☆" * (5 - full), obj.rating)


@admin.register(Address)
class AddressAdmin(ModelAdmin):
    list_display = ("full_name", "user", "city", "state", "pincode", "is_default")
    list_filter = ("state", "is_default")
    search_fields = ("full_name", "user__username", "pincode", "city")
    autocomplete_fields = ("user",)
