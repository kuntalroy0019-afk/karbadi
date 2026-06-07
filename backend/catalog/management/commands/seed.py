"""Seed Karbadi with demo data: users, sellers, categories, brands, parts,
vehicles, OEM catalogue, couriers and smart-select rules.

    python manage.py seed
"""
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Brand, Category, Part, VehicleListing
from oem.models import (
    Fitment,
    OemPart,
    RegistrationLookup,
    VehicleMake,
    VehicleModel,
)
from shipping.models import Courier, CourierRule

User = get_user_model()

CATEGORIES = [
    ("Body Parts", "body"),
    ("Mechanical Parts", "mechanical"),
    ("Electric Components", "electric"),
    ("Sensors", "sensors"),
    ("Accessories", "accessories"),
]

BRANDS = ["Maruti Suzuki", "Tata", "Kia", "Hyundai", "Mahindra", "Toyota"]


class Command(BaseCommand):
    help = "Seed the Karbadi database with demo data."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding Karbadi...")

        # --- Categories & brands -----------------------------------------
        cats = {}
        for i, (name, icon) in enumerate(CATEGORIES):
            cat, _ = Category.objects.get_or_create(
                name=name, defaults={"icon": icon, "order": i}
            )
            cats[name] = cat

        brands = {}
        for name in BRANDS:
            brands[name], _ = Brand.objects.get_or_create(name=name, defaults={"is_oem": True})

        # --- Users / sellers ---------------------------------------------
        admin = self._user("admin", "admin@karbadi.in", role=User.Role.ADMIN,
                            staff=True, superuser=True)
        buyer = self._user("buyer", "buyer@karbadi.in", role=User.Role.BUYER,
                           first="Demo", last="Buyer", phone="9000000001")

        from accounts.models import SellerProfile
        sellers = []
        seller_meta = [
            ("autohub", "AutoHub Spares", "Mumbai", "Maharashtra", "400001", True, True),
            ("partszone", "PartsZone Delhi", "Delhi", "Delhi", "110001", False, True),
            ("kiaoem", "Kia Genuine Parts", "Bengaluru", "Karnataka", "560001", True, False),
        ]
        for uname, shop, city, state, pin, is_oem, best in seller_meta:
            u = self._user(uname, f"{uname}@karbadi.in", role=User.Role.SELLER,
                           phone="9000000002", approved=True)
            sp, _ = SellerProfile.objects.get_or_create(
                user=u,
                defaults=dict(
                    shop_name=shop, city=city, state=state, pincode=pin,
                    is_oem=is_oem, is_best_seller=best, rating=Decimal("4.5"),
                    rating_count=120, description=f"{shop} — genuine & quality parts.",
                ),
            )
            sellers.append(u)

        # --- Parts --------------------------------------------------------
        # Some OEM part numbers intentionally match catalogue entries below
        # (MS-1245-OEM, TA-3321-OEM, HY-2204-OEM) so OEM cross-match returns
        # live seller listings.
        sample_parts = [
            ("Urea Pump (AdBlue)", "Mechanical Parts", "new", "12345-UREA", 8500, 9500, ""),
            ("Air Filter Element (OEM)", "Mechanical Parts", "new", "MS-1245-OEM", 620, 750, ""),
            ("LED Headlight Assembly", "Electric Components", "used", "TA-3321-OEM", 4200, 6000, ""),
            ("Smart Key Remote", "Accessories", "new", "KEY-SMART-01", 3200, 3800, ""),
            ("Front Bumper Grille", "Body Parts", "new", "BMP-FR-001", 5400, 6200, ""),
            ("ABS Wheel Speed Sensor (OEM)", "Sensors", "new", "HY-2204-OEM", 1790, 2100, ""),
            ("Brake Pad Set", "Mechanical Parts", "new", "BRK-PAD-09", 1800, 2200, ""),
            ("Alternator 90A", "Electric Components", "used", "ALT-90A", 6800, 8500, ""),
        ]
        created_parts = []
        for i, (title, cat, cond, oem_no, price, mrp, _ign) in enumerate(sample_parts):
            seller = sellers[i % len(sellers)]
            part, _ = Part.objects.get_or_create(
                title=title, seller=seller,
                defaults=dict(
                    category=cats[cat], condition=cond, oem_part_number=oem_no,
                    price=Decimal(price), mrp=Decimal(mrp), stock=10,
                    brand=brands[BRANDS[i % len(BRANDS)]],
                    is_featured=(i < 3),
                    compatible_vehicles="Swift, Baleno, Dzire",
                    description=f"Genuine quality {title.lower()}. Tested and warranted.",
                ),
            )
            created_parts.append(part)

        # --- Vehicle listings --------------------------------------------
        vehicles = [
            ("2018 Maruti Swift VXI", "Maruti Suzuki", "Swift", 2018, "petrol", 42000, 525000),
            ("2020 Tata Nexon XZ", "Tata", "Nexon", 2020, "diesel", 35000, 890000),
            ("2019 Kia Seltos HTX", "Kia", "Seltos", 2019, "petrol", 28000, 1150000),
        ]
        for i, (title, bname, model, year, fuel, km, price) in enumerate(vehicles):
            VehicleListing.objects.get_or_create(
                title=title, seller=sellers[i % len(sellers)],
                defaults=dict(
                    brand=brands[bname], model_name=model, year=year, fuel_type=fuel,
                    km_driven=km, owners=1, price=Decimal(price), city="Mumbai",
                    description=f"Well maintained {title}. Single owner, all papers clear.",
                ),
            )

        # --- OEM catalogue (Module 3) ------------------------------------
        oem_data = {
            "Maruti Suzuki": ["Swift", "Baleno", "Dzire", "Brezza"],
            "Tata": ["Nexon", "Punch", "Harrier"],
            "Kia": ["Seltos", "Sonet", "Carens"],
            "Hyundai": ["i20", "Creta", "Venue"],
        }
        models_by_name = {}
        for make_name, model_names in oem_data.items():
            make, _ = VehicleMake.objects.get_or_create(name=make_name, defaults={"country": "India"})
            for mname in model_names:
                vm, _ = VehicleModel.objects.get_or_create(
                    make=make, name=mname,
                    defaults={"year_start": 2015, "year_end": 2026},
                )
                models_by_name[mname] = vm

        oem_parts = [
            ("MS-1245-OEM", "Air Filter Element", "Mechanical Parts", 650, ["Swift", "Baleno", "Dzire"]),
            ("MS-9920-OEM", "Brake Disc Front", "Mechanical Parts", 2400, ["Swift", "Brezza"]),
            ("TA-3321-OEM", "Headlamp Assembly LH", "Electric Components", 5600, ["Nexon", "Harrier"]),
            ("KI-7781-OEM", "Door Handle Outer", "Body Parts", 980, ["Seltos", "Sonet"]),
            ("HY-2204-OEM", "ABS Wheel Speed Sensor", "Sensors", 1850, ["i20", "Creta"]),
            ("MS-5050-OEM", "Cabin AC Filter", "Accessories", 420, ["Swift", "Dzire", "Baleno"]),
        ]
        for oem_no, name, cat, mrp, fits in oem_parts:
            op, _ = OemPart.objects.get_or_create(
                oem_number=oem_no,
                defaults=dict(name=name, category=cats.get(cat), mrp=Decimal(mrp),
                              description=f"Genuine OEM {name}."),
            )
            for mname in fits:
                if mname in models_by_name:
                    Fitment.objects.get_or_create(
                        oem_part=op, vehicle_model=models_by_name[mname],
                        defaults={"year_from": 2015, "year_to": 2026},
                    )

        # Registration lookups (reg-no search demo).
        reg_map = [
            ("MH12", "Swift", 2018, "petrol"),
            ("DL3C", "Nexon", 2020, "diesel"),
            ("KA01", "Seltos", 2019, "petrol"),
            ("MH01", "Baleno", 2021, "petrol"),
        ]
        for prefix, model, year, fuel in reg_map:
            if model in models_by_name:
                RegistrationLookup.objects.get_or_create(
                    prefix=prefix, vehicle_model=models_by_name[model],
                    defaults={"year": year, "fuel_type": fuel},
                )

        # --- Couriers & smart-select rules (Modules 1 & 2) ---------------
        sr, _ = Courier.objects.get_or_create(
            code="shiprocket",
            defaults=dict(name="Shiprocket", reliability=Decimal("0.92"), supports_cod=True),
        )
        sm, _ = Courier.objects.get_or_create(
            code="shree_maruti",
            defaults=dict(name="Shree Maruti Courier", reliability=Decimal("0.88"), supports_cod=True),
        )
        # Prefer Shiprocket for metros (400/110/560), Shree Maruti elsewhere.
        rules = [
            (sr, "400", 50, "Prefer Shiprocket in Mumbai metro"),
            (sr, "110", 50, "Prefer Shiprocket in Delhi metro"),
            (sr, "560", 50, "Prefer Shiprocket in Bengaluru metro"),
            (sm, "", 20, "Shree Maruti default for Tier 2/3 cities"),
        ]
        for courier, prefix, prio, note in rules:
            CourierRule.objects.get_or_create(
                courier=courier, pincode_prefix=prefix,
                defaults={"priority": prio, "note": note},
            )

        self.stdout.write(self.style.SUCCESS(
            "Seed complete.\n"
            f"  Admin login: admin / admin12345\n"
            f"  Buyer login: buyer / buyer12345\n"
            f"  Seller login: autohub / seller12345 (also partszone, kiaoem)\n"
            f"  Parts: {Part.objects.count()}, OEM parts: {OemPart.objects.count()}, "
            f"Vehicles: {VehicleListing.objects.count()}"
        ))

    def _user(self, username, email, role, first="", last="", phone="",
              staff=False, superuser=False, approved=False):
        defaults = dict(
            email=email, role=role, first_name=first, last_name=last,
            phone=phone, is_staff=staff, is_superuser=superuser,
            is_seller_approved=approved,
        )
        user, created = User.objects.get_or_create(username=username, defaults=defaults)
        if created:
            pwd = {
                User.Role.ADMIN: "admin12345",
                User.Role.BUYER: "buyer12345",
                User.Role.SELLER: "seller12345",
            }[role]
            user.set_password(pwd)
            user.save()
        return user
