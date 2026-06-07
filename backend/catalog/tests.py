"""Tests for catalog: categories, parts list/filter/search/detail, vehicles, permissions."""
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Part
from karbadi.testutils import (
    auth_client,
    make_brand,
    make_category,
    make_part,
    make_seller,
    make_user,
    make_vehicle,
)


class CategoryBrandTests(APITestCase):
    def test_categories_public_and_unpaginated(self):
        make_category("Body Parts")
        make_category("Sensors")
        resp = self.client.get("/api/catalog/categories/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)  # not wrapped in pagination

    def test_brand_oem_filter(self):
        make_brand("Tata")
        resp = self.client.get("/api/catalog/brands/", {"is_oem": "true"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class PartListingTests(APITestCase):
    def setUp(self):
        self.seller = make_seller()
        self.cat = make_category("Mechanical")
        self.new_part = make_part(self.seller, self.cat, condition=Part.Condition.NEW,
                                  price="1000", title="Brake Pad", oem_part_number="BR-1")
        self.used_part = make_part(self.seller, self.cat, condition=Part.Condition.USED,
                                   price="500", title="Used Mirror")

    def test_list_is_public(self):
        resp = self.client.get("/api/catalog/parts/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

    def test_filter_by_condition(self):
        resp = self.client.get("/api/catalog/parts/", {"condition": "used"})
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["title"], "Used Mirror")

    def test_search_by_title_and_oem(self):
        self.assertEqual(self.client.get("/api/catalog/parts/", {"search": "Brake"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/catalog/parts/", {"search": "BR-1"}).data["count"], 1)

    def test_inactive_parts_hidden(self):
        make_part(self.seller, self.cat, title="Hidden", is_active=False)
        self.assertEqual(self.client.get("/api/catalog/parts/").data["count"], 2)

    def test_ordering_by_price(self):
        resp = self.client.get("/api/catalog/parts/", {"ordering": "price"})
        prices = [float(p["price"]) for p in resp.data["results"]]
        self.assertEqual(prices, sorted(prices))

    def test_detail_increments_view_count(self):
        self.assertEqual(self.new_part.views, 0)
        self.client.get(f"/api/catalog/parts/{self.new_part.id}/")
        self.new_part.refresh_from_db()
        self.assertEqual(self.new_part.views, 1)

    def test_featured_endpoint(self):
        make_part(self.seller, self.cat, title="Feat", is_featured=True)
        resp = self.client.get("/api/catalog/parts/featured/")
        self.assertTrue(all(p["is_featured"] for p in resp.data))


class PartPermissionTests(APITestCase):
    def setUp(self):
        self.cat = make_category()
        self.payload = {"title": "New Listing", "category": self.cat.id,
                        "condition": "new", "price": "999", "stock": 5}

    def test_anonymous_cannot_create(self):
        resp = self.client.post("/api/catalog/parts/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_buyer_cannot_create(self):
        client = auth_client(make_user(role="buyer"))
        resp = client.post("/api/catalog/parts/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_can_create_and_is_owner(self):
        seller = make_seller()
        resp = auth_client(seller).post("/api/catalog/parts/", self.payload, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Part.objects.get(id=resp.data["id"]).seller, seller)

    def test_seller_cannot_edit_others_part(self):
        owner = make_seller()
        part = make_part(owner, self.cat)
        intruder = make_seller()
        resp = auth_client(intruder).patch(f"/api/catalog/parts/{part.id}/",
                                           {"price": "1"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_my_listings_returns_only_own(self):
        seller = make_seller()
        make_part(seller, self.cat, title="Mine")
        make_part(make_seller(), self.cat, title="Theirs")
        resp = auth_client(seller).get("/api/catalog/parts/my-listings/")
        titles = [p["title"] for p in resp.data["results"]]
        self.assertEqual(titles, ["Mine"])

    def test_my_listings_includes_inactive_and_exposes_is_active(self):
        seller = make_seller()
        make_part(seller, self.cat, title="Active one", is_active=True)
        make_part(seller, self.cat, title="Hidden one", is_active=False)
        resp = auth_client(seller).get("/api/catalog/parts/my-listings/")
        self.assertEqual(resp.data["count"], 2)  # inactive included for the owner
        self.assertIn("is_active", resp.data["results"][0])

    def test_seller_can_toggle_active_via_patch(self):
        seller = make_seller()
        part = make_part(seller, self.cat, is_active=True)
        resp = auth_client(seller).patch(f"/api/catalog/parts/{part.id}/",
                                         {"is_active": False}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        part.refresh_from_db()
        self.assertFalse(part.is_active)

    def test_seller_can_delete_own_part(self):
        seller = make_seller()
        part = make_part(seller, self.cat)
        resp = auth_client(seller).delete(f"/api/catalog/parts/{part.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Part.objects.filter(id=part.id).exists())

    def test_filter_parts_by_seller_id(self):
        s1, s2 = make_seller(), make_seller()
        make_part(s1, self.cat, title="S1 part")
        make_part(s2, self.cat, title="S2 part")
        resp = self.client.get("/api/catalog/parts/", {"seller": s1.id})
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["title"], "S1 part")

    def test_part_list_exposes_is_active(self):
        seller = make_seller()
        make_part(seller, self.cat)
        resp = self.client.get("/api/catalog/parts/")
        self.assertIn("is_active", resp.data["results"][0])


class VehicleTests(APITestCase):
    def test_list_and_filter_vehicles(self):
        seller = make_seller()
        make_vehicle(seller, title="Swift 2018", year=2018, fuel_type="petrol")
        make_vehicle(seller, title="Nexon 2020", year=2020, fuel_type="diesel")
        resp = self.client.get("/api/catalog/vehicles/", {"fuel_type": "diesel"})
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["title"], "Nexon 2020")

    def test_buyer_cannot_create_vehicle(self):
        client = auth_client(make_user(role="buyer"))
        resp = client.post("/api/catalog/vehicles/", {
            "title": "x", "model_name": "y", "year": 2020, "price": "1",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
