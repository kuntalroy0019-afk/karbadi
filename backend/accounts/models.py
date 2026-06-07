"""Accounts: custom user with marketplace roles, seller profiles, addresses."""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user. A single account can buy and (if approved) sell."""

    class Role(models.TextChoices):
        BUYER = "buyer", "Buyer"
        SELLER = "seller", "Seller"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.BUYER)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_seller_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    @property
    def is_seller(self):
        return self.role in (self.Role.SELLER, self.Role.ADMIN)


class SellerProfile(models.Model):
    """Storefront details for a seller / OEM dealer."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="seller_profile")
    shop_name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="seller_logos/", blank=True, null=True)
    gstin = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=80, blank=True)
    state = models.CharField(max_length=80, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    is_oem = models.BooleanField(default=False, help_text="OEM / authorised brand seller")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    is_best_seller = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_best_seller", "-rating", "-created_at"]

    def __str__(self):
        return self.shop_name


class Address(models.Model):
    """Shipping address for a buyer."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=40, default="Home")
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=15)
    line1 = models.CharField(max_length=200)
    line2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=80)
    state = models.CharField(max_length=80)
    pincode = models.CharField(max_length=10)
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ["-is_default", "id"]

    def __str__(self):
        return f"{self.label} - {self.city} ({self.pincode})"
