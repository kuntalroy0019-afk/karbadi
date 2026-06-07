from django.db.models import F
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Brand, Category, Part, VehicleListing
from .permissions import IsSellerOrReadOnly
from .serializers import (
    BrandSerializer,
    CategorySerializer,
    PartDetailSerializer,
    PartListSerializer,
    PartWriteSerializer,
    VehicleDetailSerializer,
    VehicleListSerializer,
    VehicleWriteSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filterset_fields = ["is_oem"]


class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.filter(is_active=True).select_related(
        "category", "brand", "seller", "seller__seller_profile"
    ).prefetch_related("images")
    permission_classes = [IsSellerOrReadOnly]
    filterset_fields = ["condition", "category", "brand", "seller", "is_featured"]
    search_fields = ["title", "description", "oem_part_number", "compatible_vehicles"]
    ordering_fields = ["price", "created_at", "views"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return PartWriteSerializer
        if self.action == "retrieve":
            return PartDetailSerializer
        return PartListSerializer

    def retrieve(self, request, *args, **kwargs):
        # Bump view count (kept simple; race-safe via F()).
        Part.objects.filter(pk=kwargs["pk"]).update(views=F("views") + 1)
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        qs = self.filter_queryset(self.get_queryset()).filter(is_featured=True)[:10]
        ser = PartListSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)

    @action(detail=False, methods=["get"], url_path="my-listings",
            permission_classes=[permissions.IsAuthenticated])
    def my_listings(self, request):
        qs = Part.objects.filter(seller=request.user).prefetch_related("images")
        page = self.paginate_queryset(qs)
        ser = PartListSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = VehicleListing.objects.filter(is_active=True).select_related(
        "brand", "seller"
    ).prefetch_related("images")
    permission_classes = [IsSellerOrReadOnly]
    filterset_fields = ["brand", "fuel_type", "year", "is_sold", "city"]
    search_fields = ["title", "model_name", "description", "city"]
    ordering_fields = ["price", "year", "km_driven", "created_at"]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return VehicleWriteSerializer
        if self.action == "retrieve":
            return VehicleDetailSerializer
        return VehicleListSerializer
