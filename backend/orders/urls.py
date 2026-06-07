from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CartItemViewSet,
    CartView,
    CheckoutView,
    InquiryViewSet,
    OrderViewSet,
)

router = DefaultRouter()
router.register("orders", OrderViewSet, basename="order")
router.register("cart-items", CartItemViewSet, basename="cart-item")
router.register("inquiries", InquiryViewSet, basename="inquiry")

urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
] + router.urls
