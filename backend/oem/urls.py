from rest_framework.routers import DefaultRouter

from .views import OemPartViewSet, VehicleMakeViewSet, VehicleModelViewSet

router = DefaultRouter()
router.register("makes", VehicleMakeViewSet, basename="oem-make")
router.register("models", VehicleModelViewSet, basename="oem-model")
router.register("parts", OemPartViewSet, basename="oem-part")

urlpatterns = router.urls
