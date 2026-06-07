"""Tests for the OEM catalogue: makes/models, drill-down, reg lookup, cross-match."""
from rest_framework import status
from rest_framework.test import APITestCase

from karbadi.testutils import make_oem_world, make_part, make_seller
from oem.models import OemPart
from oem.services import resolve_registration


class MakeModelTests(APITestCase):
    def setUp(self):
        self.world = make_oem_world()

    def test_makes_public(self):
        resp = self.client.get("/api/oem/makes/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_models_nested_under_make(self):
        make = self.world["make"]
        resp = self.client.get(f"/api/oem/makes/{make.id}/models/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data[0]["make_name"], make.name)
        self.assertIn("years", resp.data[0])

    def test_model_years_expand(self):
        model = self.world["model"]
        self.assertEqual(model.years[0], 2015)
        self.assertIn(2025, model.years)


class DrilldownAndSearchTests(APITestCase):
    def setUp(self):
        self.world = make_oem_world()

    def test_by_vehicle_returns_fitting_parts(self):
        model = self.world["model"]
        resp = self.client.get("/api/oem/parts/by-vehicle/", {"model": model.id})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = [p["id"] for p in resp.data["results"]]
        self.assertIn(self.world["oem"].id, ids)

    def test_search_by_oem_number(self):
        oem = self.world["oem"]
        resp = self.client.get("/api/oem/parts/", {"search": oem.oem_number})
        self.assertEqual(resp.data["count"], 1)

    def test_part_detail_lists_compatible_vehicles(self):
        oem = self.world["oem"]
        resp = self.client.get(f"/api/oem/parts/{oem.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(len(resp.data["compatible_vehicles"]) >= 1)


class RegistrationLookupTests(APITestCase):
    def setUp(self):
        self.world = make_oem_world()  # reg prefix MH99 -> model

    def test_lookup_resolves_make_model(self):
        resp = self.client.get("/api/oem/parts/lookup-registration/", {"reg": "MH99XY1234"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["model"], self.world["model"].name)
        self.assertGreaterEqual(len(resp.data["parts"]), 1)

    def test_lookup_unknown_returns_404(self):
        resp = self.client.get("/api/oem/parts/lookup-registration/", {"reg": "ZZ00ZZ0000"})
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_resolve_registration_is_case_and_space_insensitive(self):
        info = resolve_registration("  mh99 xy 1234 ")
        self.assertIsNotNone(info)
        self.assertEqual(info["model_id"], self.world["model"].id)

    def test_resolve_empty_returns_none(self):
        self.assertIsNone(resolve_registration(""))


class CrossMatchTests(APITestCase):
    def test_oem_detail_cross_matches_live_listings(self):
        world = make_oem_world()
        oem = world["oem"]
        seller = make_seller()
        # A seller lists a part sharing this OEM number.
        make_part(seller, oem_part_number=oem.oem_number, title="Live Listing")
        # A non-matching part should not appear.
        make_part(seller, oem_part_number="UNRELATED", title="Other")
        resp = self.client.get(f"/api/oem/parts/{oem.id}/")
        listings = resp.data["matching_listings"]
        self.assertEqual(len(listings), 1)
        self.assertEqual(listings[0]["title"], "Live Listing")

    def test_cross_match_is_case_insensitive(self):
        oem = OemPart.objects.create(oem_number="ABC-123", name="Thing")
        make_part(make_seller(), oem_part_number="abc-123", title="lower")
        resp = self.client.get(f"/api/oem/parts/{oem.id}/")
        self.assertEqual(len(resp.data["matching_listings"]), 1)
