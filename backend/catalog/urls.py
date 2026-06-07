from rest_framework.routers import DefaultRouter

from .views import BrandViewSet, CategoryViewSet, PartViewSet, VehicleViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("brands", BrandViewSet, basename="brand")
router.register("parts", PartViewSet, basename="part")
router.register("vehicles", VehicleViewSet, basename="vehicle")

urlpatterns = router.urls
