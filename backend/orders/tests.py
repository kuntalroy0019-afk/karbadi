"""Tests for orders: cart operations, checkout (+smart courier), inquiries, cancel."""
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from karbadi.testutils import (
    auth_client,
    make_couriers,
    make_part,
    make_seller,
    make_user,
)
from orders.models import Cart, Inquiry, Order


class CartTests(APITestCase):
    def setUp(self):
        self.buyer = make_user("cartbuyer")
        self.client = auth_client(self.buyer)
        self.part = make_part(price="1000", stock=20)

    def test_cart_requires_auth(self):
        anon = APIClient()
        self.assertEqual(anon.get("/api/orders/cart/").status_code,
                         status.HTTP_401_UNAUTHORIZED)

    def test_add_to_cart(self):
        resp = self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 2}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["item_count"], 2)
        self.assertEqual(Decimal(resp.data["subtotal"]), Decimal("2000"))

    def test_adding_same_part_increments(self):
        self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 1}, format="json")
        resp = self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 3}, format="json")
        self.assertEqual(resp.data["item_count"], 4)

    def test_update_quantity_and_zero_removes(self):
        self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 2}, format="json")
        item_id = Cart.objects.get(user=self.buyer).items.first().id
        self.client.patch(f"/api/orders/cart-items/{item_id}/", {"quantity": 5}, format="json")
        self.assertEqual(Cart.objects.get(user=self.buyer).items.first().quantity, 5)
        resp = self.client.patch(f"/api/orders/cart-items/{item_id}/", {"quantity": 0}, format="json")
        self.assertEqual(resp.data["item_count"], 0)

    def test_remove_item(self):
        self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 1}, format="json")
        item_id = Cart.objects.get(user=self.buyer).items.first().id
        resp = self.client.delete(f"/api/orders/cart-items/{item_id}/")
        self.assertEqual(resp.data["item_count"], 0)


class CheckoutTests(APITestCase):
    def setUp(self):
        make_couriers()  # so the smart engine can book
        self.buyer = make_user("cobuyer")
        self.client = auth_client(self.buyer)
        self.part = make_part(price="1000", stock=20)
        self.address = {
            "ship_full_name": "Demo", "ship_phone": "9000000000",
            "ship_line1": "12 MG Road", "ship_city": "Mumbai",
            "ship_state": "Maharashtra", "ship_pincode": "400001",
            "payment_method": "cod",
        }

    def _add_to_cart(self, qty=2):
        self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": qty}, format="json")

    def test_empty_cart_cannot_checkout(self):
        resp = self.client.post("/api/orders/checkout/", self.address, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_address_fields_rejected(self):
        self._add_to_cart()
        resp = self.client.post("/api/orders/checkout/", {"payment_method": "cod"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_successful_checkout_creates_confirmed_order_with_shipment(self):
        self._add_to_cart(qty=2)
        resp = self.client.post("/api/orders/checkout/", self.address, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], "confirmed")
        self.assertIsNotNone(resp.data["shipment"])
        self.assertTrue(resp.data["shipment"]["awb"])
        # Mumbai 400xxx -> Shiprocket rule wins
        self.assertEqual(resp.data["shipment"]["courier_code"], "shiprocket")

    def test_checkout_totals_include_shipping(self):
        self._add_to_cart(qty=2)
        resp = self.client.post("/api/orders/checkout/", self.address, format="json")
        items = Decimal(resp.data["items_total"])
        ship = Decimal(resp.data["shipping_fee"])
        self.assertEqual(Decimal(resp.data["grand_total"]), items + ship)
        self.assertEqual(items, Decimal("2000"))

    def test_checkout_empties_cart_and_decrements_stock(self):
        self._add_to_cart(qty=3)
        self.client.post("/api/orders/checkout/", self.address, format="json")
        self.assertEqual(Cart.objects.get(user=self.buyer).items.count(), 0)
        self.part.refresh_from_db()
        self.assertEqual(self.part.stock, 17)

    def test_quoted_shipping_matches_charged_shipping(self):
        # Bug fix: the rate shown at checkout must equal the final shipment charge.
        self._add_to_cart(qty=2)
        from shipping.engine import quote_couriers
        quote = next(q for q in quote_couriers("400001", cod=True, weight_kg=2) if q.get("eligible"))
        resp = self.client.post("/api/orders/checkout/", self.address, format="json")
        self.assertAlmostEqual(float(resp.data["shipping_fee"]), float(quote["rate"]), places=2)

    def test_checkout_without_couriers_still_places_order_with_warning(self):
        # No couriers seeded here -> engine raises, but order persists.
        Order.objects.all().delete()
        from shipping.models import Courier
        Courier.objects.all().delete()
        self._add_to_cart()
        resp = self.client.post("/api/orders/checkout/", self.address, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("shipping_warning", resp.data)
        self.assertIsNone(resp.data["shipment"])


class OrderManagementTests(APITestCase):
    def setUp(self):
        make_couriers()
        self.buyer = make_user("ordbuyer")
        self.client = auth_client(self.buyer)
        self.part = make_part(price="1000", stock=20)

    def _place_order(self):
        self.client.post("/api/orders/cart-items/", {"part": self.part.id, "quantity": 1}, format="json")
        return self.client.post("/api/orders/checkout/", {
            "ship_full_name": "D", "ship_phone": "9", "ship_line1": "x",
            "ship_city": "Mumbai", "ship_state": "MH", "ship_pincode": "400001",
            "payment_method": "cod",
        }, format="json").data

    def test_orders_scoped_to_buyer(self):
        self._place_order()
        other = auth_client(make_user("other"))
        self.assertEqual(other.get("/api/orders/orders/").data["count"], 0)
        self.assertEqual(self.client.get("/api/orders/orders/").data["count"], 1)

    def test_sales_lists_orders_with_sellers_items(self):
        self._place_order()  # part belongs to self.part.seller
        seller = self.part.seller
        resp = auth_client(seller).get("/api/orders/orders/sales/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        # An unrelated seller sees no sales.
        from karbadi.testutils import make_seller
        self.assertEqual(auth_client(make_seller()).get("/api/orders/orders/sales/").data["count"], 0)

    def test_cancel_confirmed_order(self):
        order = self._place_order()
        resp = self.client.post(f"/api/orders/orders/{order['id']}/cancel/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "cancelled")

    def test_cannot_cancel_shipped_order(self):
        order = self._place_order()
        o = Order.objects.get(id=order["id"])
        o.status = Order.Status.SHIPPED
        o.save()
        resp = self.client.post(f"/api/orders/orders/{order['id']}/cancel/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class InquiryTests(APITestCase):
    def setUp(self):
        self.seller = make_seller()
        self.part = make_part(self.seller)
        self.buyer = make_user("inqbuyer")

    def test_buyer_creates_inquiry_seller_auto_assigned(self):
        resp = auth_client(self.buyer).post("/api/orders/inquiries/", {
            "part": self.part.id, "message": "Is this available?",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        inquiry = Inquiry.objects.get(id=resp.data["id"])
        self.assertEqual(inquiry.seller, self.seller)
        self.assertEqual(inquiry.buyer, self.buyer)

    def test_seller_can_reply_buyer_cannot(self):
        inquiry = Inquiry.objects.create(buyer=self.buyer, seller=self.seller,
                                         part=self.part, message="hi")
        # buyer cannot reply
        resp = auth_client(self.buyer).post(f"/api/orders/inquiries/{inquiry.id}/reply/",
                                            {"reply": "no"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        # seller can
        resp = auth_client(self.seller).post(f"/api/orders/inquiries/{inquiry.id}/reply/",
                                             {"reply": "Yes, in stock"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, Inquiry.Status.ANSWERED)

    def test_inquiry_visibility(self):
        Inquiry.objects.create(buyer=self.buyer, seller=self.seller, part=self.part, message="q")
        # both buyer and seller see it
        self.assertEqual(auth_client(self.buyer).get("/api/orders/inquiries/").data["count"], 1)
        self.assertEqual(auth_client(self.seller).get("/api/orders/inquiries/").data["count"], 1)
        # unrelated user sees none
        self.assertEqual(auth_client(make_user("stranger")).get("/api/orders/inquiries/").data["count"], 0)
