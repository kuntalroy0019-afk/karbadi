from rest_framework import serializers

from catalog.models import Part
from catalog.serializers import PartListSerializer

from .models import Cart, CartItem, Inquiry, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    part_detail = PartListSerializer(source="part", read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "part", "part_detail", "quantity", "line_total"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "item_count"]


class AddToCartSerializer(serializers.Serializer):
    part = serializers.PrimaryKeyRelatedField(queryset=Part.objects.filter(is_active=True))
    quantity = serializers.IntegerField(min_value=1, default=1)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "part", "title", "unit_price", "quantity", "line_total", "seller"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "payment_method", "is_paid",
            "ship_full_name", "ship_phone", "ship_line1", "ship_line2",
            "ship_city", "ship_state", "ship_pincode",
            "items_total", "shipping_fee", "grand_total",
            "items", "shipment", "created_at",
        ]

    def get_shipment(self, obj):
        from shipping.serializers import ShipmentSerializer
        shipment = getattr(obj, "shipment", None)
        if shipment:
            return ShipmentSerializer(shipment, context=self.context).data
        return None


class CheckoutSerializer(serializers.Serializer):
    """Convert the user's cart into an order."""
    address_id = serializers.IntegerField(required=False)
    # Or inline address fields if no saved address:
    ship_full_name = serializers.CharField(required=False)
    ship_phone = serializers.CharField(required=False)
    ship_line1 = serializers.CharField(required=False)
    ship_line2 = serializers.CharField(required=False, allow_blank=True)
    ship_city = serializers.CharField(required=False)
    ship_state = serializers.CharField(required=False)
    ship_pincode = serializers.CharField(required=False)
    payment_method = serializers.ChoiceField(
        choices=Order.Payment.choices, default=Order.Payment.COD
    )
    # Courier chosen by the smart engine on the checkout screen (optional override).
    courier_code = serializers.CharField(required=False, allow_blank=True)


class InquirySerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source="buyer.username", read_only=True)
    part_title = serializers.CharField(source="part.title", read_only=True, default=None)

    class Meta:
        model = Inquiry
        fields = [
            "id", "buyer", "buyer_name", "seller", "part", "part_title",
            "vehicle", "message", "reply", "status", "created_at",
        ]
        read_only_fields = ["buyer", "seller", "reply", "status"]
