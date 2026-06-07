from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Part

from .models import Cart, CartItem, Inquiry, Order, OrderItem
from .serializers import (
    AddToCartSerializer,
    CartSerializer,
    CheckoutSerializer,
    InquirySerializer,
    OrderSerializer,
)


def _get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_cart(request.user)
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """Add to cart (or increment if the part is already present)."""
        ser = AddToCartSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cart = _get_cart(request.user)
        part = ser.validated_data["part"]
        qty = ser.validated_data["quantity"]
        item, created = CartItem.objects.get_or_create(cart=cart, part=part)
        item.quantity = qty if created else item.quantity + qty
        item.save()
        return Response(
            CartSerializer(cart, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, pk=None):
        """Set absolute quantity for a line item."""
        cart = _get_cart(request.user)
        item = get_object_or_404(CartItem, pk=pk, cart=cart)
        qty = int(request.data.get("quantity", item.quantity))
        if qty <= 0:
            item.delete()
        else:
            item.quantity = qty
            item.save()
        return Response(CartSerializer(cart, context={"request": request}).data)

    def destroy(self, request, pk=None):
        cart = _get_cart(request.user)
        CartItem.objects.filter(pk=pk, cart=cart).delete()
        return Response(CartSerializer(cart, context={"request": request}).data)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(buyer=self.request.user)
            .prefetch_related("items")
            .select_related("shipment")
        )

    @action(detail=False, methods=["get"], url_path="sales")
    def sales(self, request):
        """Orders containing the current seller's items."""
        qs = Order.objects.filter(items__seller=request.user).distinct()
        page = self.paginate_queryset(qs)
        ser = OrderSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(ser.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status in (Order.Status.SHIPPED, Order.Status.DELIVERED):
            return Response({"detail": "Order already shipped."}, status=400)
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order, context={"request": request}).data)


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ser = CheckoutSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        cart = _get_cart(request.user)
        if not cart.items.exists():
            return Response({"detail": "Cart is empty."}, status=400)

        # Resolve shipping address (saved address takes precedence).
        ship = {}
        addr_id = data.get("address_id")
        if addr_id:
            addr = get_object_or_404(request.user.addresses, pk=addr_id)
            ship = {
                "ship_full_name": addr.full_name, "ship_phone": addr.phone,
                "ship_line1": addr.line1, "ship_line2": addr.line2,
                "ship_city": addr.city, "ship_state": addr.state,
                "ship_pincode": addr.pincode,
            }
        else:
            required = ["ship_full_name", "ship_phone", "ship_line1",
                        "ship_city", "ship_state", "ship_pincode"]
            missing = [f for f in required if not data.get(f)]
            if missing:
                return Response(
                    {"detail": f"Missing address fields: {', '.join(missing)}"},
                    status=400,
                )
            ship = {k: data.get(k, "") for k in required + ["ship_line2"]}

        order = Order.objects.create(
            buyer=request.user,
            payment_method=data["payment_method"],
            **ship,
        )
        for ci in cart.items.select_related("part", "part__seller"):
            OrderItem.objects.create(
                order=order,
                part=ci.part,
                seller=ci.part.seller,
                title=ci.part.title,
                unit_price=ci.part.price,
                quantity=ci.quantity,
            )
            # Decrement stock.
            Part.objects.filter(pk=ci.part_id).update(
                stock=max(0, ci.part.stock - ci.quantity)
            )
        order.recalc()

        # --- Smart courier auto-selection (Module 2) --------------------
        from shipping.engine import auto_select_and_book
        courier_override = data.get("courier_code") or None
        try:
            auto_select_and_book(order, courier_override=courier_override)
        except Exception as exc:  # never block checkout on courier failure
            order.refresh_from_db()
            order_data = OrderSerializer(order, context={"request": request}).data
            order_data["shipping_warning"] = str(exc)
            cart.items.all().delete()
            return Response(order_data, status=status.HTTP_201_CREATED)

        order.refresh_from_db()
        cart.items.all().delete()
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class InquiryViewSet(viewsets.ModelViewSet):
    serializer_class = InquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Buyers see what they sent; sellers see what they received.
        return Inquiry.objects.filter(buyer=user) | Inquiry.objects.filter(seller=user)

    def perform_create(self, serializer):
        part = serializer.validated_data.get("part")
        vehicle = serializer.validated_data.get("vehicle")
        seller = None
        if part:
            seller = part.seller
        elif vehicle:
            seller = vehicle.seller
        serializer.save(buyer=self.request.user, seller=seller)

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        inquiry = self.get_object()
        if inquiry.seller_id != request.user.id:
            return Response({"detail": "Only the seller can reply."}, status=403)
        inquiry.reply = request.data.get("reply", "")
        inquiry.status = Inquiry.Status.ANSWERED
        inquiry.save(update_fields=["reply", "status"])
        return Response(self.get_serializer(inquiry).data)
