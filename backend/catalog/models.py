"""Catalog: part categories, brands, part listings (new/used) and vehicle listings."""
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    """Top-level part category, e.g. Body Parts, Mechanical, Sensors."""
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    icon = models.CharField(max_length=40, blank=True, help_text="Icon key for the app")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["order", "name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Brand(models.Model):
    """Vehicle / part brand, e.g. Maruti Suzuki, Tata, Kia."""
    name = models.CharField(max_length=80, unique=True)
    slug = models.SlugField(max_length=90, unique=True, blank=True)
    logo = models.ImageField(upload_to="brands/", blank=True, null=True)
    is_oem = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Part(models.Model):
    """A spare-part listing posted by a seller. Can be new or used."""

    class Condition(models.TextChoices):
        NEW = "new", "New Part"
        USED = "used", "Used Part"

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="parts"
    )
    title = models.CharField(max_length=160)
    slug = models.SlugField(max_length=180, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="parts"
    )
    brand = models.ForeignKey(
        Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="parts"
    )
    condition = models.CharField(max_length=5, choices=Condition.choices, default=Condition.NEW)
    oem_part_number = models.CharField(max_length=80, blank=True, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    # Free-text vehicle compatibility, e.g. "Swift 2015-2020, Baleno"
    compatible_vehicles = models.CharField(max_length=255, blank=True)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, default=1)
    views = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["condition", "is_active"])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)[:170]
        super().save(*args, **kwargs)

    @property
    def discount_percent(self):
        if self.mrp and self.mrp > self.price:
            return round((self.mrp - self.price) / self.mrp * 100)
        return 0

    def __str__(self):
        return self.title


class PartImage(models.Model):
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="parts/")
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.part_id}"


class VehicleListing(models.Model):
    """A whole-vehicle buy/sell listing."""

    class FuelType(models.TextChoices):
        PETROL = "petrol", "Petrol"
        DIESEL = "diesel", "Diesel"
        CNG = "cng", "CNG"
        ELECTRIC = "electric", "Electric"
        HYBRID = "hybrid", "Hybrid"

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="vehicle_listings"
    )
    title = models.CharField(max_length=160)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    model_name = models.CharField(max_length=80)
    year = models.PositiveIntegerField()
    fuel_type = models.CharField(max_length=10, choices=FuelType.choices, default=FuelType.PETROL)
    km_driven = models.PositiveIntegerField(default=0)
    owners = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    city = models.CharField(max_length=80, blank=True)
    registration_number = models.CharField(max_length=20, blank=True)
    is_sold = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.year})"


class VehicleImage(models.Model):
    listing = models.ForeignKey(VehicleListing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="vehicles/")
    is_primary = models.BooleanField(default=False)
