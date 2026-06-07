"""OEM catalogue (Module 3 — Oriparts integration).

Vehicle Make -> Model -> Year -> Category -> OEM Part Number drill-down,
plus registration-number lookup and cross-match to live seller listings.
"""
from django.db import models


class VehicleMake(models.Model):
    name = models.CharField(max_length=80, unique=True)
    logo = models.ImageField(upload_to="oem/makes/", blank=True, null=True)
    country = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class VehicleModel(models.Model):
    make = models.ForeignKey(VehicleMake, on_delete=models.CASCADE, related_name="models")
    name = models.CharField(max_length=80)
    year_start = models.PositiveIntegerField(default=2000)
    year_end = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["make__name", "name"]
        unique_together = ("make", "name")

    def __str__(self):
        return f"{self.make.name} {self.name}"

    @property
    def years(self):
        end = self.year_end or 2026
        return list(range(self.year_start, end + 1))


class OemPart(models.Model):
    """A genuine OEM part record from the Oriparts catalogue."""
    oem_number = models.CharField(max_length=80, unique=True, db_index=True)
    name = models.CharField(max_length=160)
    category = models.ForeignKey(
        "catalog.Category", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="oem_parts",
    )
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="oem/parts/", blank=True, null=True)
    mrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    # M2M to the vehicle models this part fits.
    compatible_models = models.ManyToManyField(
        VehicleModel, through="Fitment", related_name="oem_parts"
    )
    source = models.CharField(max_length=40, default="oriparts")
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.oem_number} — {self.name}"


class Fitment(models.Model):
    """Which vehicle/year-range a given OEM part fits."""
    oem_part = models.ForeignKey(OemPart, on_delete=models.CASCADE)
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE)
    year_from = models.PositiveIntegerField(null=True, blank=True)
    year_to = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("oem_part", "vehicle_model")

    def __str__(self):
        return f"{self.oem_part.oem_number} fits {self.vehicle_model}"


class RegistrationLookup(models.Model):
    """Maps an RTO/registration prefix to a make+model for reg-no search.

    e.g. prefix 'MH12' -> Pune; combined with a sample mapping for demo.
    Real deployments hit a VAHAN-style API via the OEM adapter.
    """
    prefix = models.CharField(max_length=12, db_index=True)
    vehicle_model = models.ForeignKey(VehicleModel, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(null=True, blank=True)
    fuel_type = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.prefix} -> {self.vehicle_model}"
