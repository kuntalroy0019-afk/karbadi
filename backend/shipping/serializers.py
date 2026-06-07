from rest_framework import serializers

from .models import Courier, CourierRule, Shipment, TrackingEvent


class CourierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Courier
        fields = ["id", "code", "name", "is_active", "supports_cod", "reliability", "logo"]


class CourierRuleSerializer(serializers.ModelSerializer):
    courier_code = serializers.CharField(source="courier.code", read_only=True)

    class Meta:
        model = CourierRule
        fields = ["id", "courier", "courier_code", "pincode_prefix", "priority", "note"]


class TrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrackingEvent
        fields = ["id", "status", "location", "note", "timestamp"]


class ShipmentSerializer(serializers.ModelSerializer):
    courier_name = serializers.CharField(source="courier.name", read_only=True)
    courier_code = serializers.CharField(source="courier.code", read_only=True)
    events = TrackingEventSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)

    class Meta:
        model = Shipment
        fields = [
            "id", "order_number", "courier_name", "courier_code", "awb", "courier_ref",
            "status", "shipping_charge", "estimated_delivery_days", "label_url",
            "selection_reason", "events", "created_at", "updated_at",
        ]


class ServiceabilityQuerySerializer(serializers.Serializer):
    pincode = serializers.CharField()
    cod = serializers.BooleanField(default=False)
    weight_kg = serializers.FloatField(default=1.0)
