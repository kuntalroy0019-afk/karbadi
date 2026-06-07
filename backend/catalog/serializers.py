from rest_framework import serializers

from accounts.serializers import SellerProfileSerializer
from karbadi import images as dummy

from .models import (
    Brand,
    Category,
    Part,
    PartImage,
    VehicleImage,
    VehicleListing,
)


class CategorySerializer(serializers.ModelSerializer):
    part_count = serializers.IntegerField(source="parts.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "icon", "image", "order", "part_count"]


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "logo", "is_oem"]


class PartImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartImage
        fields = ["id", "image", "is_primary"]


class PartListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    seller_shop = serializers.SerializerMethodField()
    discount_percent = serializers.IntegerField(read_only=True)

    class Meta:
        model = Part
        fields = [
            "id", "title", "slug", "price", "mrp", "discount_percent", "condition",
            "oem_part_number", "category_name", "seller_shop", "primary_image",
            "stock", "is_featured", "is_active", "created_at",
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            return self.context["request"].build_absolute_uri(img.image.url)
        return dummy.part_image(obj.id)

    def get_seller_shop(self, obj):
        profile = getattr(obj.seller, "seller_profile", None)
        return profile.shop_name if profile else obj.seller.username


class PartDetailSerializer(PartListSerializer):
    images = PartImageSerializer(many=True, read_only=True)
    brand = BrandSerializer(read_only=True)
    seller_profile = serializers.SerializerMethodField()

    class Meta(PartListSerializer.Meta):
        fields = PartListSerializer.Meta.fields + [
            "description", "images", "brand", "category", "compatible_vehicles",
            "weight_kg", "views", "seller_profile",
        ]

    def get_seller_profile(self, obj):
        profile = getattr(obj.seller, "seller_profile", None)
        if profile:
            return SellerProfileSerializer(profile, context=self.context).data
        return None


class PartWriteSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = Part
        fields = [
            "id", "title", "description", "category", "brand", "condition",
            "oem_part_number", "price", "mrp", "stock", "is_active", "is_featured",
            "compatible_vehicles", "weight_kg", "uploaded_images",
        ]

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        part = Part.objects.create(seller=self.context["request"].user, **validated_data)
        for i, img in enumerate(images):
            PartImage.objects.create(part=part, image=img, is_primary=(i == 0))
        return part

    def update(self, instance, validated_data):
        images = validated_data.pop("uploaded_images", [])
        instance = super().update(instance, validated_data)
        for img in images:
            PartImage.objects.create(part=instance, image=img)
        return instance


class VehicleImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleImage
        fields = ["id", "image", "is_primary"]


class VehicleListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    brand_name = serializers.CharField(source="brand.name", read_only=True)

    class Meta:
        model = VehicleListing
        fields = [
            "id", "title", "brand_name", "model_name", "year", "fuel_type",
            "km_driven", "owners", "price", "city", "is_sold", "primary_image",
            "created_at",
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and img.image:
            return self.context["request"].build_absolute_uri(img.image.url)
        return dummy.vehicle_image(obj.id)


class VehicleDetailSerializer(VehicleListSerializer):
    images = VehicleImageSerializer(many=True, read_only=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    seller_phone = serializers.CharField(source="seller.phone", read_only=True)

    class Meta(VehicleListSerializer.Meta):
        fields = VehicleListSerializer.Meta.fields + [
            "description", "registration_number", "images", "seller_name",
            "seller_phone", "is_active",
        ]


class VehicleWriteSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model = VehicleListing
        fields = [
            "id", "title", "brand", "model_name", "year", "fuel_type",
            "km_driven", "owners", "price", "description", "city",
            "registration_number", "is_sold", "is_active", "uploaded_images",
        ]

    def create(self, validated_data):
        images = validated_data.pop("uploaded_images", [])
        listing = VehicleListing.objects.create(
            seller=self.context["request"].user, **validated_data
        )
        for i, img in enumerate(images):
            VehicleImage.objects.create(listing=listing, image=img, is_primary=(i == 0))
        return listing
