from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Address, SellerProfile

User = get_user_model()


class SellerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    # The seller's user id — used to filter listings by ?seller=<user_id>.
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = SellerProfile
        fields = [
            "id", "user_id", "username", "shop_name", "description", "logo", "gstin",
            "city", "state", "pincode", "is_oem", "rating", "rating_count",
            "is_best_seller", "created_at",
        ]
        read_only_fields = ["rating", "rating_count", "is_best_seller", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    seller_profile = SellerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "phone",
            "role", "avatar", "is_seller_approved", "seller_profile",
        ]
        read_only_fields = ["role", "is_seller_approved"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "phone", "role"]

    def validate_role(self, value):
        # Only buyer/seller can self-register; admin is created via Django admin.
        if value == User.Role.ADMIN:
            raise serializers.ValidationError("Cannot self-register as admin.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "label", "full_name", "phone", "line1", "line2",
            "city", "state", "pincode", "is_default",
        ]


class KarbadiTokenSerializer(TokenObtainPairSerializer):
    """Embed lightweight user info in the JWT response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
