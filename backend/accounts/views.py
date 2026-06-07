from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import SellerProfile
from .permissions import IsProfileOwnerOrReadOnly
from .serializers import (
    AddressSerializer,
    KarbadiTokenSerializer,
    RegisterSerializer,
    SellerProfileSerializer,
    UserSerializer,
)

User = get_user_model()


class KarbadiTokenView(TokenObtainPairView):
    serializer_class = KarbadiTokenSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.addresses.all()

    def perform_create(self, serializer):
        addr = serializer.save(user=self.request.user)
        if addr.is_default:
            self.request.user.addresses.exclude(pk=addr.pk).update(is_default=False)


class SellerProfileViewSet(viewsets.ModelViewSet):
    """Public read for storefronts; sellers manage their own profile."""
    queryset = SellerProfile.objects.select_related("user").all()
    serializer_class = SellerProfileSerializer
    filterset_fields = ["is_oem", "is_best_seller", "city", "state"]
    search_fields = ["shop_name", "city", "description"]
    ordering_fields = ["rating", "created_at"]

    # Public read actions (a custom get_permissions takes precedence over the
    # @action(permission_classes=...) kwarg, so list them explicitly here).
    public_actions = ("list", "retrieve", "best_sellers", "oem_sellers")

    def get_permissions(self):
        if self.action in self.public_actions:
            return [permissions.AllowAny()]
        # Writes require auth AND (for object-level ops) storefront ownership.
        return [permissions.IsAuthenticated(), IsProfileOwnerOrReadOnly()]

    def perform_create(self, serializer):
        # One storefront per account.
        if SellerProfile.objects.filter(user=self.request.user).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError("You already have a storefront.")
        serializer.save(user=self.request.user)
        # Mark the account as a seller on first storefront creation.
        user = self.request.user
        if user.role == User.Role.BUYER:
            user.role = User.Role.SELLER
            user.save(update_fields=["role"])

    @action(detail=False, methods=["get", "put", "patch"], url_path="me",
            permission_classes=[permissions.IsAuthenticated])
    def my_storefront(self, request):
        """The current user's own storefront — convenience for the vendor app."""
        profile = SellerProfile.objects.filter(user=request.user).first()
        if request.method == "GET":
            if not profile:
                return Response({"detail": "No storefront yet."}, status=404)
            return Response(self.get_serializer(profile).data)
        # PUT/PATCH upsert
        partial = request.method == "PATCH"
        serializer = self.get_serializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if profile:
            serializer.save()
        else:
            serializer.save(user=request.user)
            if request.user.role == User.Role.BUYER:
                request.user.role = User.Role.SELLER
                request.user.save(update_fields=["role"])
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="best-sellers",
            permission_classes=[permissions.AllowAny])
    def best_sellers(self, request):
        qs = self.get_queryset().filter(is_best_seller=True)[:10]
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"], url_path="oem",
            permission_classes=[permissions.AllowAny])
    def oem_sellers(self, request):
        qs = self.get_queryset().filter(is_oem=True)
        return Response(self.get_serializer(qs, many=True).data)
