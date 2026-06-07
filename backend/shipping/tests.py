"""Tests for shipping: mock adapters, smart engine (scoring/rules/fallback),
serviceability API, tracking, webhook, cancel."""
from decimal import Decimal

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from karbadi.testutils import auth_client, make_couriers, make_part, make_user
from orders.models import Order, OrderItem
from shipping.adapters import (
    MockShiprocketAdapter,
    MockShreeMarutiAdapter,
    ShiprocketAdapter,
    ShreeMarutiAdapter,
    get_adapter,
)
from shipping.engine import auto_select_and_book, quote_couriers
from shipping.models import Courier, CourierRule, Shipment


def _order(buyer, pincode="400001", payment="cod", qty=2, price="1000"):
    order = Order.objects.create(
        buyer=buyer, payment_method=payment,
        ship_full_name="D", ship_phone="9", ship_line1="x",
        ship_city="Mumbai", ship_state="MH", ship_pincode=pincode,
    )
    part = make_part(price=price, stock=50)
    OrderItem.objects.create(order=order, part=part, seller=part.seller,
                             title=part.title, unit_price=Decimal(price), quantity=qty)
    order.recalc()
    order.save()
    return order


class MockAdapterTests(TestCase):
    def test_factory_returns_mock_by_default(self):
        self.assertIsInstance(get_adapter("shiprocket"), MockShiprocketAdapter)
        self.assertIsInstance(get_adapter("shree_maruti"), MockShreeMarutiAdapter)

    def test_factory_returns_real_when_mock_off(self):
        with self.settings(KARBADI={**self._k(), "USE_MOCK_COURIERS": False}):
            self.assertIsInstance(get_adapter("shiprocket"), ShiprocketAdapter)
            self.assertIsInstance(get_adapter("shree_maruti"), ShreeMarutiAdapter)

    def test_unknown_courier_raises(self):
        with self.assertRaises(ValueError):
            get_adapter("dhl")

    def test_serviceability_is_deterministic(self):
        a = MockShiprocketAdapter()
        self.assertEqual(a.serviceability("400001"), a.serviceability("400001"))

    def test_pincode_999_not_serviceable(self):
        self.assertFalse(MockShiprocketAdapter().serviceability("560999")["serviceable"])

    def test_book_returns_awb_and_label(self):
        result = MockShiprocketAdapter().book({"order_number": "KB1"})
        self.assertTrue(result["awb"].startswith("SHI"))
        self.assertIn("label_url", result)

    def test_track_returns_events(self):
        track = MockShiprocketAdapter().track("SHI1234567")
        self.assertIn("status", track)
        self.assertIsInstance(track["events"], list)

    @staticmethod
    def _k():
        from django.conf import settings
        import copy
        return copy.deepcopy(settings.KARBADI)


class ScoringEngineTests(TestCase):
    def setUp(self):
        self.couriers = make_couriers()

    def test_quote_ranks_and_scores(self):
        quotes = quote_couriers("400001", cod=True, weight_kg=2)
        eligible = [q for q in quotes if q.get("eligible")]
        self.assertGreaterEqual(len(eligible), 1)
        # sorted descending by score
        scores = [q["score"] for q in eligible]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_metro_rule_favours_shiprocket(self):
        quotes = quote_couriers("400001", cod=False, weight_kg=1)
        top = next(q for q in quotes if q.get("eligible"))
        self.assertEqual(top["courier_code"], "shiprocket")

    def test_non_serviceable_pincode_has_no_eligible(self):
        quotes = quote_couriers("560999", cod=False)
        self.assertFalse(any(q.get("eligible") for q in quotes))

    def test_cod_unsupported_pincode_excluded(self):
        # mock marks pincodes ending 000 as COD-unavailable
        quotes = quote_couriers("400000", cod=True)
        self.assertFalse(any(q.get("eligible") for q in quotes))

    def test_quote_rate_matches_adapter_rate_no_double_weight(self):
        # Bug fix: engine must not add a weight surcharge on top of the
        # adapter's (already weight-inclusive) rate.
        adapter_rate = MockShiprocketAdapter().serviceability("400001", cod=False, weight=3)["rate"]
        quote = next(q for q in quote_couriers("400001", cod=False, weight_kg=3)
                     if q["courier_code"] == "shiprocket")
        self.assertAlmostEqual(quote["rate"], adapter_rate, places=2)


class BookingEngineTests(TestCase):
    def setUp(self):
        self.couriers = make_couriers()
        self.buyer = make_user("shipbuyer")

    def test_auto_select_books_shipment_and_confirms_order(self):
        order = _order(self.buyer, pincode="400001")
        shipment = auto_select_and_book(order)
        self.assertIsInstance(shipment, Shipment)
        self.assertTrue(shipment.awb)
        self.assertEqual(shipment.courier.code, "shiprocket")
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.CONFIRMED)
        self.assertGreater(order.shipping_fee, 0)

    def test_selection_reason_recorded(self):
        order = _order(self.buyer)
        shipment = auto_select_and_book(order)
        self.assertEqual(shipment.selection_reason["chosen"], "shiprocket")
        self.assertIn("considered", shipment.selection_reason)

    def test_courier_override_respected(self):
        order = _order(self.buyer, pincode="400001")
        shipment = auto_select_and_book(order, courier_override="shree_maruti")
        self.assertEqual(shipment.courier.code, "shree_maruti")

    def test_fallback_when_primary_unserviceable(self):
        # Disable Shiprocket; Shree Maruti should take over.
        Courier.objects.filter(code="shiprocket").update(is_active=False)
        order = _order(self.buyer, pincode="560001")
        shipment = auto_select_and_book(order)
        self.assertEqual(shipment.courier.code, "shree_maruti")

    def test_no_serviceable_courier_raises(self):
        order = _order(self.buyer, pincode="400999")  # 999 -> none serviceable
        with self.assertRaises(RuntimeError):
            auto_select_and_book(order)

    def test_initial_tracking_event_created(self):
        order = _order(self.buyer)
        shipment = auto_select_and_book(order)
        self.assertEqual(shipment.events.count(), 1)


class ServiceabilityAPITests(APITestCase):
    def setUp(self):
        make_couriers()

    def test_serviceability_public(self):
        resp = self.client.get("/api/shipping/serviceability/", {"pincode": "400001", "cod": "true"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(resp.data["recommended"])
        self.assertEqual(resp.data["recommended"]["courier_code"], "shiprocket")

    def test_serviceability_unserviceable_pincode(self):
        resp = self.client.get("/api/shipping/serviceability/", {"pincode": "560999"})
        self.assertIsNone(resp.data["recommended"])

    def test_couriers_list_public(self):
        resp = self.client.get("/api/shipping/couriers/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class TrackingAndWebhookTests(APITestCase):
    def setUp(self):
        make_couriers()
        self.buyer = make_user("trackbuyer")
        self.order = _order(self.buyer)
        self.shipment = auto_select_and_book(self.order)

    def test_track_pulls_events_and_updates_status(self):
        resp = auth_client(self.buyer).get(f"/api/shipping/shipments/{self.shipment.id}/track/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data["events"]), 1)

    def test_shipment_scoped_to_buyer(self):
        stranger = make_user("stranger2")
        resp = auth_client(stranger).get(f"/api/shipping/shipments/{self.shipment.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_webhook_updates_status_and_order(self):
        resp = self.client.post(
            f"/api/shipping/webhook/{self.shipment.courier.code}/",
            {"awb": self.shipment.awb, "status": "delivered", "location": "Mumbai"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.order.refresh_from_db()
        self.assertEqual(self.shipment.status, "delivered")
        self.assertEqual(self.order.status, Order.Status.DELIVERED)

    def test_webhook_requires_awb_and_status(self):
        resp = self.client.post(f"/api/shipping/webhook/shiprocket/", {"awb": "x"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_shipment(self):
        resp = auth_client(self.buyer).post(f"/api/shipping/shipments/{self.shipment.id}/cancel/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "cancelled")


class CourierRuleAdminAPITests(APITestCase):
    def setUp(self):
        self.couriers = make_couriers()

    def test_courier_rules_admin_only(self):
        # anonymous / buyer forbidden
        self.assertIn(self.client.get("/api/shipping/courier-rules/").status_code,
                      (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        buyer = auth_client(make_user("ruleb"))
        self.assertEqual(buyer.get("/api/shipping/courier-rules/").status_code,
                         status.HTTP_403_FORBIDDEN)

    def test_admin_can_manage_rules(self):
        admin = auth_client(make_user("ruleadmin", role="admin", is_staff=True))
        resp = admin.post("/api/shipping/courier-rules/", {
            "courier": self.couriers["shree_maruti"].id,
            "pincode_prefix": "560", "priority": 99, "note": "BLR test",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CourierRule.objects.filter(pincode_prefix="560", priority=99).exists())
