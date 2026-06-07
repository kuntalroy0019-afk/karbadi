from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import OemPart, VehicleMake, VehicleModel
from .serializers import (
    OemPartDetailSerializer,
    OemPartListSerializer,
    VehicleMakeSerializer,
    VehicleModelSerializer,
)
from .services import resolve_registration, sync_catalogue


class VehicleMakeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VehicleMake.objects.all()
    serializer_class = VehicleMakeSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    search_fields = ["name"]

    @action(detail=True, methods=["get"])
    def models(self, request, pk=None):
        qs = VehicleModel.objects.filter(make_id=pk)
        ser = VehicleModelSerializer(qs, many=True, context={"request": request})
        return Response(ser.data)


class VehicleModelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VehicleModel.objects.select_related("make").all()
    serializer_class = VehicleModelSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
    filterset_fields = ["make"]
    search_fields = ["name", "make__name"]


class OemPartViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OemPart.objects.select_related("category").all()
    permission_classes = [permissions.AllowAny]
    search_fields = ["oem_number", "name", "description"]
    filterset_fields = ["category", "compatible_models"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return OemPartDetailSerializer
        return OemPartListSerializer

    @action(detail=False, methods=["get"], url_path="by-vehicle")
    def by_vehicle(self, request):
        """Drill-down result: parts fitting a model (optionally + category)."""
        model_id = request.query_params.get("model")
        category_id = request.query_params.get("category")
        qs = self.get_queryset()
        if model_id:
            qs = qs.filter(compatible_models__id=model_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        qs = qs.distinct()
        page = self.paginate_queryset(qs)
        ser = OemPartListSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    @action(detail=False, methods=["get"], url_path="lookup-registration")
    def lookup_registration(self, request):
        """Search by Vehicle Reg No. -> auto-detect make/model -> compatible parts."""
        reg = request.query_params.get("reg", "")
        info = resolve_registration(reg)
        if not info:
            return Response(
                {"detail": "Could not resolve this registration number.", "reg": reg},
                status=404,
            )
        parts = OemPart.objects.filter(
            compatible_models__id=info["model_id"]
        ).distinct()
        info["parts"] = OemPartListSerializer(
            parts, many=True, context={"request": request}
        ).data
        return Response(info)

    @action(detail=False, methods=["post"], url_path="sync",
            permission_classes=[permissions.IsAdminUser])
    def sync(self, request):
        return Response(sync_catalogue())
