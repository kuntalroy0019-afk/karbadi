"""Orders: cart, orders, order items and buyer<->seller inquiries."""
from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils.crypto import get_random_string


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def subtotal(self):
        return sum((i.line_total for i in self.items.all()), Decimal("0"))

    @property
    def item_count(self):
        return sum(i.quantity for i in self.items.all())

    def __str__(self):
        return f"Cart({self.user})"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    part = models.ForeignKey("catalog.Part", on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("cart", "part")

    @property
    def line_total(self):
        return self.part.price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.part.title}"


def _gen_order_number():
    return "KB" + get_random_string(8, "0123456789")


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        PACKED = "packed", "Packed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class Payment(models.TextChoices):
        COD = "cod", "Cash on Delivery"
        PREPAID = "prepaid", "Prepaid"

    order_number = models.CharField(max_length=20, unique=True, default=_gen_order_number)
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=10, choices=Payment.choices, default=Payment.COD)
    is_paid = models.BooleanField(default=False)

    # Snapshot of shipping address (immutable after order).
    ship_full_name = models.CharField(max_length=120)
    ship_phone = models.CharField(max_length=15)
    ship_line1 = models.CharField(max_length=200)
    ship_line2 = models.CharField(max_length=200, blank=True)
    ship_city = models.CharField(max_length=80)
    ship_state = models.CharField(max_length=80)
    ship_pincode = models.CharField(max_length=10)

    items_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def recalc(self):
        self.items_total = sum((i.line_total for i in self.items.all()), Decimal("0"))
        # shipping_fee may be set from a float (courier rate); coerce safely.
        self.shipping_fee = Decimal(str(self.shipping_fee or 0))
        self.grand_total = self.items_total + self.shipping_fee
        return self.grand_total

    def __str__(self):
        return self.order_number


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    part = models.ForeignKey("catalog.Part", on_delete=models.SET_NULL, null=True)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="sold_items"
    )
    title = models.CharField(max_length=160)  # snapshot
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.title}"


class Inquiry(models.Model):
    """Buyer inquiry against a part or vehicle listing (the 'Inquiry' button)."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ANSWERED = "answered", "Answered"
        CLOSED = "closed", "Closed"

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="inquiries"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_inquiries"
    )
    part = models.ForeignKey(
        "catalog.Part", on_delete=models.CASCADE, null=True, blank=True, related_name="inquiries"
    )
    vehicle = models.ForeignKey(
        "catalog.VehicleListing", on_delete=models.CASCADE, null=True, blank=True,
        related_name="inquiries",
    )
    message = models.TextField()
    reply = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Inquiries"

    def __str__(self):
        return f"Inquiry #{self.pk} by {self.buyer}"
