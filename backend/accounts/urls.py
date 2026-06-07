from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    AddressViewSet,
    KarbadiTokenView,
    MeView,
    RegisterView,
    SellerProfileViewSet,
)

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="address")
router.register("sellers", SellerProfileViewSet, basename="seller")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", KarbadiTokenView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
