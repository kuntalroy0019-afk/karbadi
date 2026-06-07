"""Shared factory helpers for the Karbadi test suites.

Kept dependency-free (no factory_boy) so the suite runs with just Django + DRF.
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import SellerProfile
from catalog.models import Brand, Category, Part, VehicleListing
from oem.models import Fitment, OemPart, RegistrationLookup, VehicleMake, VehicleModel
from shipping.models import Courier, CourierRule

User = get_user_model()

_counter = {"n": 0}


def _uniq(prefix=""):
    _counter["n"] += 1
    return f"{prefix}{_counter['n']}"


def make_user(username=None, password="pass12345", role=User.Role.BUYER, **kwargs):
    username = username or _uniq("user")
    user = User.objects.create_user(
        username=username,
        email=f"{username}@karbadi.test",
        password=password,
        role=role,
        **kwargs,
    )
    return user


def make_seller(username=None, password="pass12345", shop_name=None, **profile_kwargs):
    user = make_user(username or _uniq("seller"), password, role=User.Role.SELLER,
                     is_seller_approved=True)
    SellerProfile.objects.create(
        user=user,
        shop_name=shop_name or _uniq("Shop "),
        city=profile_kwargs.pop("city", "Mumbai"),
        state=profile_kwargs.pop("state", "Maharashtra"),
        pincode=profile_kwargs.pop("pincode", "400001"),
        rating=profile_kwargs.pop("rating", Decimal("4.5")),
        **profile_kwargs,
    )
    return user


def make_admin(username="admin_t", password="pass12345"):
    return make_user(username, password, role=User.Role.ADMIN, is_staff=True, is_superuser=True)


def make_category(name=None):
    name = name or _uniq("Category ")
    return Category.objects.create(name=name)


def make_brand(name=None):
    return Brand.objects.create(name=name or _uniq("Brand "))


def make_part(seller=None, category=None, condition=Part.Condition.NEW,
              price="1000", oem_part_number="", **kwargs):
    seller = seller or make_seller()
    category = category or make_category()
    return Part.objects.create(
        seller=seller,
        category=category,
        title=kwargs.pop("title", _uniq("Part ")),
        condition=condition,
        price=Decimal(price),
        oem_part_number=oem_part_number,
        stock=kwargs.pop("stock", 10),
        **kwargs,
    )


def make_vehicle(seller=None, **kwargs):
    seller = seller or make_seller()
    return VehicleListing.objects.create(
        seller=seller,
        title=kwargs.pop("title", _uniq("Vehicle ")),
        model_name=kwargs.pop("model_name", "Swift"),
        year=kwargs.pop("year", 2018),
        price=Decimal(kwargs.pop("price", "500000")),
        **kwargs,
    )


def make_oem_world():
    """Create a make/model + an OEM part fitting it + a reg lookup."""
    make = VehicleMake.objects.create(name=_uniq("Make "))
    model = VehicleModel.objects.create(make=make, name=_uniq("Model "),
                                        year_start=2015, year_end=2025)
    oem = OemPart.objects.create(oem_number=_uniq("OEM-"), name=_uniq("OemPart "))
    Fitment.objects.create(oem_part=oem, vehicle_model=model, year_from=2015, year_to=2025)
    reg = RegistrationLookup.objects.create(prefix="MH99", vehicle_model=model,
                                            year=2018, fuel_type="petrol")
    return {"make": make, "model": model, "oem": oem, "reg": reg}


def make_couriers():
    """Seed both couriers + a metro rule favouring Shiprocket for 400xxx."""
    sr = Courier.objects.create(code="shiprocket", name="Shiprocket",
                                reliability=Decimal("0.92"))
    sm = Courier.objects.create(code="shree_maruti", name="Shree Maruti Courier",
                                reliability=Decimal("0.88"))
    CourierRule.objects.create(courier=sr, pincode_prefix="400", priority=50)
    CourierRule.objects.create(courier=sm, pincode_prefix="", priority=20)
    return {"shiprocket": sr, "shree_maruti": sm}


def auth_client(user):
    """An APIClient force-authenticated as `user`."""
    client = APIClient()
    client.force_authenticate(user=user)
    return client
