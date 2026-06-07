"""Tests for accounts: registration, JWT auth, profile, sellers, addresses."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from karbadi.testutils import auth_client, make_seller, make_user

User = get_user_model()


class RegistrationTests(APITestCase):
    url = "/api/auth/register/"

    def test_register_buyer_succeeds(self):
        resp = self.client.post(self.url, {
            "username": "newbuyer", "email": "b@x.com", "password": "secret123",
            "role": "buyer",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newbuyer").exists())

    def test_password_is_hashed_not_stored_plaintext(self):
        self.client.post(self.url, {
            "username": "hashme", "email": "h@x.com", "password": "secret123",
        }, format="json")
        user = User.objects.get(username="hashme")
        self.assertNotEqual(user.password, "secret123")
        self.assertTrue(user.check_password("secret123"))

    def test_cannot_self_register_as_admin(self):
        resp = self.client.post(self.url, {
            "username": "wannabe", "email": "a@x.com", "password": "secret123",
            "role": "admin",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_short_password_rejected(self):
        resp = self.client.post(self.url, {
            "username": "shorty", "email": "s@x.com", "password": "123",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class JWTAuthTests(APITestCase):
    def setUp(self):
        self.user = make_user("loginuser", password="pass12345")

    def test_login_returns_tokens_and_user(self):
        resp = self.client.post("/api/auth/login/", {
            "username": "loginuser", "password": "pass12345",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)
        self.assertEqual(resp.data["user"]["username"], "loginuser")

    def test_login_wrong_password_fails(self):
        resp = self.client.post("/api/auth/login/", {
            "username": "loginuser", "password": "wrong",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_issues_new_access(self):
        login = self.client.post("/api/auth/login/", {
            "username": "loginuser", "password": "pass12345",
        }, format="json")
        resp = self.client.post("/api/auth/refresh/", {
            "refresh": login.data["refresh"],
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)

    def test_me_requires_auth(self):
        self.assertEqual(self.client.get("/api/auth/me/").status_code,
                         status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        client = auth_client(self.user)
        resp = client.get("/api/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["username"], "loginuser")

    def test_me_cannot_escalate_role(self):
        client = auth_client(self.user)
        client.patch("/api/auth/me/", {"role": "admin"}, format="json")
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.BUYER)


class SellerProfileTests(APITestCase):
    def test_creating_storefront_promotes_buyer_to_seller(self):
        buyer = make_user("aspiring", role=User.Role.BUYER)
        client = auth_client(buyer)
        resp = client.post("/api/auth/sellers/", {
            "shop_name": "My Shop", "city": "Pune", "state": "MH",
        }, format="json")
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        buyer.refresh_from_db()
        self.assertEqual(buyer.role, User.Role.SELLER)

    def test_sellers_list_is_public(self):
        make_seller(shop_name="Public Shop")
        resp = self.client.get("/api/auth/sellers/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_oem_and_best_seller_filters(self):
        make_seller(shop_name="OEM One", is_oem=True)
        make_seller(shop_name="Best One", is_best_seller=True)
        oem = self.client.get("/api/auth/sellers/oem/")
        best = self.client.get("/api/auth/sellers/best-sellers/")
        self.assertTrue(all(s["is_oem"] for s in oem.data))
        self.assertTrue(all(s["is_best_seller"] for s in best.data))

    def test_seller_cannot_edit_another_storefront(self):
        owner = make_seller(shop_name="Owner Shop")
        intruder = make_seller(shop_name="Intruder Shop")
        pid = owner.seller_profile.id
        resp = auth_client(intruder).patch(f"/api/auth/sellers/{pid}/",
                                           {"shop_name": "Hijacked"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        owner.seller_profile.refresh_from_db()
        self.assertEqual(owner.seller_profile.shop_name, "Owner Shop")

    def test_owner_can_edit_own_storefront(self):
        owner = make_seller(shop_name="Owner Shop")
        resp = auth_client(owner).patch(f"/api/auth/sellers/{owner.seller_profile.id}/",
                                        {"shop_name": "Renamed"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        owner.seller_profile.refresh_from_db()
        self.assertEqual(owner.seller_profile.shop_name, "Renamed")

    def test_me_storefront_get_and_upsert(self):
        seller = make_user("freshseller", role=User.Role.SELLER, is_seller_approved=True)
        client = auth_client(seller)
        # No storefront yet
        self.assertEqual(client.get("/api/auth/sellers/me/").status_code, status.HTTP_404_NOT_FOUND)
        # Create via PUT
        resp = client.put("/api/auth/sellers/me/", {"shop_name": "My New Shop"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["shop_name"], "My New Shop")
        # Now GET returns it
        self.assertEqual(client.get("/api/auth/sellers/me/").data["shop_name"], "My New Shop")

    def test_cannot_create_second_storefront(self):
        seller = make_seller(shop_name="First")
        resp = auth_client(seller).post("/api/auth/sellers/",
                                        {"shop_name": "Second"}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class AddressTests(APITestCase):
    def setUp(self):
        self.user = make_user("addruser")
        self.client = auth_client(self.user)

    def test_create_and_list_address_scoped_to_user(self):
        self.client.post("/api/auth/addresses/", {
            "full_name": "A B", "phone": "9", "line1": "x", "city": "Mumbai",
            "state": "MH", "pincode": "400001",
        }, format="json")
        other = make_user("other")
        auth_client(other).post("/api/auth/addresses/", {
            "full_name": "C D", "phone": "8", "line1": "y", "city": "Delhi",
            "state": "DL", "pincode": "110001",
        }, format="json")
        resp = self.client.get("/api/auth/addresses/")
        self.assertEqual(len(resp.data["results"]), 1)
        self.assertEqual(resp.data["results"][0]["full_name"], "A B")

    def test_setting_new_default_unsets_previous(self):
        self.client.post("/api/auth/addresses/", {
            "full_name": "First", "phone": "9", "line1": "x", "city": "Mumbai",
            "state": "MH", "pincode": "400001", "is_default": True,
        }, format="json")
        self.client.post("/api/auth/addresses/", {
            "full_name": "Second", "phone": "9", "line1": "x", "city": "Mumbai",
            "state": "MH", "pincode": "400002", "is_default": True,
        }, format="json")
        defaults = self.user.addresses.filter(is_default=True)
        self.assertEqual(defaults.count(), 1)
        self.assertEqual(defaults.first().full_name, "Second")
