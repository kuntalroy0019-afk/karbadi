from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CourierRuleViewSet,
    CourierViewSet,
    ServiceabilityView,
    ShipmentViewSet,
    courier_webhook,
)

router = DefaultRouter()
router.register("couriers", CourierViewSet, basename="courier")
router.register("courier-rules", CourierRuleViewSet, basename="courier-rule")
router.register("shipments", ShipmentViewSet, basename="shipment")

urlpatterns = [
    path("serviceability/", ServiceabilityView.as_view(), name="serviceability"),
    path("webhook/<str:courier_code>/", courier_webhook, name="courier-webhook"),
] + router.urls
