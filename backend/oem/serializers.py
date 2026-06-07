from rest_framework import serializers

from catalog.models import Part
from catalog.serializers import PartListSerializer
from karbadi import images as dummy

from .models import Fitment, OemPart, RegistrationLookup, VehicleMake, VehicleModel


class VehicleMakeSerializer(serializers.ModelSerializer):
    model_count = serializers.IntegerField(source="models.count", read_only=True)

    class Meta:
        model = VehicleMake
        fields = ["id", "name", "logo", "country", "model_count"]


class VehicleModelSerializer(serializers.ModelSerializer):
    make_name = serializers.CharField(source="make.name", read_only=True)
    years = serializers.ListField(read_only=True)

    class Meta:
        model = VehicleModel
        fields = ["id", "make", "make_name", "name", "year_start", "year_end", "years"]


class OemPartListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = OemPart
        fields = ["id", "oem_number", "name", "category_name", "image", "mrp"]

    def get_image(self, obj):
        if obj.image:
            request = self.context.get("request")
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return dummy.oem_image(obj.id)


class OemPartDetailSerializer(OemPartListSerializer):
    compatible_vehicles = serializers.SerializerMethodField()
    matching_listings = serializers.SerializerMethodField()

    class Meta(OemPartListSerializer.Meta):
        fields = OemPartListSerializer.Meta.fields + [
            "description", "source", "synced_at",
            "compatible_vehicles", "matching_listings",
        ]

    def get_compatible_vehicles(self, obj):
        out = []
        for fit in Fitment.objects.filter(oem_part=obj).select_related(
            "vehicle_model", "vehicle_model__make"
        ):
            out.append({
                "model_id": fit.vehicle_model_id,
                "label": str(fit.vehicle_model),
                "year_from": fit.year_from,
                "year_to": fit.year_to,
            })
        return out

    def get_matching_listings(self, obj):
        """Cross-match: live seller listings sharing this OEM part number."""
        listings = (
            Part.objects.filter(is_active=True, oem_part_number__iexact=obj.oem_number)
            .select_related("category", "seller", "seller__seller_profile")
            .prefetch_related("images")[:20]
        )
        return PartListSerializer(listings, many=True, context=self.context).data


class RegistrationLookupSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationLookup
        fields = ["id", "prefix", "vehicle_model", "year", "fuel_type"]
