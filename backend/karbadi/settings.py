"""
Django settings for the Karbadi Auto-Parts Marketplace backend.
"Every Car, Every Part" — India's auto parts marketplace.
"""
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env(key, default=None):
    return os.environ.get(key, default)


def env_bool(key, default=False):
    val = os.environ.get(key)
    if val is None:
        return default
    return val.lower() in ("1", "true", "yes", "on")


# --- Core -----------------------------------------------------------------
DEBUG = env_bool("DJANGO_DEBUG", True)

# A dev fallback key is allowed only while DEBUG is on. In production
# (DEBUG=False) a real DJANGO_SECRET_KEY MUST be supplied, or we refuse to boot.
SECRET_KEY = env("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "django-insecure-dev-key-change-me-in-production-0xkarbadi"
    else:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY environment variable is required when DEBUG=False."
        )

# Be strict about hosts in production; permissive only in DEBUG.
_default_hosts = "*" if DEBUG else ""
ALLOWED_HOSTS = [h.strip() for h in env("DJANGO_ALLOWED_HOSTS", _default_hosts).split(",") if h.strip()]

# Cloudinary is enabled automatically when credentials are present (see below).
USE_CLOUDINARY = bool(env("CLOUDINARY_URL") or env("CLOUDINARY_CLOUD_NAME"))

INSTALLED_APPS = [
    # Unfold admin theme — must precede django.contrib.admin.
    "unfold",
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.humanize",
    # third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    # local
    "accounts",
    "catalog",
    "oem",
    "orders",
    "shipping",
]

if USE_CLOUDINARY:
    # cloudinary_storage must come before staticfiles per its docs.
    INSTALLED_APPS.insert(INSTALLED_APPS.index("django.contrib.staticfiles"), "cloudinary_storage")
    INSTALLED_APPS.append("cloudinary")

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "karbadi.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "karbadi.wsgi.application"

# --- Database -------------------------------------------------------------
# SQLite for dev. Set POSTGRES_DB (+ creds) in .env to switch to Postgres.
if env("POSTGRES_DB"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("POSTGRES_DB"),
            "USER": env("POSTGRES_USER", "postgres"),
            "PASSWORD": env("POSTGRES_PASSWORD", ""),
            "HOST": env("POSTGRES_HOST", "localhost"),
            "PORT": env("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

AUTH_USER_MODEL = "accounts.User"

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# --- Static / Media -------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --- Cloudinary (media storage) ------------------------------------------
# Set CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name> (or the three
# discrete vars) to push every ImageField to Cloudinary. Without it, uploads
# fall back to the local MEDIA_ROOT so the project still runs offline.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}

if USE_CLOUDINARY:
    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", ""),
        "API_KEY": env("CLOUDINARY_API_KEY", ""),
        "API_SECRET": env("CLOUDINARY_API_SECRET", ""),
        "SECURE": True,
    }
    STORAGES["default"] = {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage",
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- DRF ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# --- CORS -----------------------------------------------------------------
# Open by default in DEBUG; in production allow all only if explicitly opted in,
# otherwise restrict to an allowlist from CORS_ALLOWED_ORIGINS (comma-separated).
CORS_ALLOW_ALL_ORIGINS = env_bool("CORS_ALLOW_ALL", DEBUG)
CORS_ALLOWED_ORIGINS = [
    o.strip() for o in env("CORS_ALLOWED_ORIGINS", "").split(",") if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

# --- Karbadi / integration settings --------------------------------------
KARBADI = {
    # Courier/OEM adapters: set the mock flags False once real creds exist.
    "USE_MOCK_COURIERS": env_bool("USE_MOCK_COURIERS", True),
    "USE_MOCK_OEM": env_bool("USE_MOCK_OEM", True),
    # Warehouse / pickup origin used for serviceability + bookings.
    "PICKUP": {
        "LOCATION": env("PICKUP_LOCATION", "Primary"),  # Shiprocket named pickup location
        "PINCODE": env("PICKUP_PINCODE", "400001"),
        "CITY": env("PICKUP_CITY", "Mumbai"),
        "STATE": env("PICKUP_STATE", "Maharashtra"),
    },
    "SHIPROCKET": {
        "EMAIL": env("SHIPROCKET_EMAIL", ""),
        "PASSWORD": env("SHIPROCKET_PASSWORD", ""),
        "BASE_URL": env("SHIPROCKET_BASE_URL", "https://apiv2.shiprocket.in/v1/external"),
    },
    "SHREE_MARUTI": {
        "API_KEY": env("SHREE_MARUTI_API_KEY", ""),
        "CLIENT_ID": env("SHREE_MARUTI_CLIENT_ID", ""),
        "BASE_URL": env("SHREE_MARUTI_BASE_URL", "https://api.shreemaruticourier.com"),
    },
    "ORIPARTS": {
        "API_KEY": env("ORIPARTS_API_KEY", ""),
        "BASE_URL": env("ORIPARTS_BASE_URL", "https://api.oriparts.com"),
    },
}

# --- Unfold admin theme ---------------------------------------------------
def _badge_open_inquiries(request):
    try:
        from orders.models import Inquiry
        n = Inquiry.objects.filter(status=Inquiry.Status.OPEN).count()
        return str(n) if n else None
    except Exception:
        return None


UNFOLD = {
    "SITE_TITLE": "Karbadi Admin",
    "SITE_HEADER": "Karbadi",
    "SITE_SUBHEADER": "Every Car, Every Part",
    "SITE_URL": "/",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": True,
    "DASHBOARD_CALLBACK": "karbadi.dashboard.dashboard_callback",
    "COLORS": {
        "primary": {
            "50": "232 240 255",
            "100": "209 224 255",
            "200": "163 193 255",
            "300": "117 161 255",
            "400": "71 130 255",
            "500": "21 101 255",   # Karbadi blue #1565FF
            "600": "11 67 194",
            "700": "8 50 145",
            "800": "6 38 110",
            "900": "4 26 76",
            "950": "2 15 46",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": True,
        "navigation": [
            {
                "title": "Overview",
                "separator": False,
                "items": [
                    {"title": "Dashboard", "icon": "dashboard", "link": "/admin/"},
                ],
            },
            {
                "title": "Marketplace",
                "separator": True,
                "items": [
                    {"title": "Parts", "icon": "build", "link": "/admin/catalog/part/"},
                    {"title": "Vehicle Listings", "icon": "directions_car", "link": "/admin/catalog/vehiclelisting/"},
                    {"title": "Categories", "icon": "category", "link": "/admin/catalog/category/"},
                    {"title": "Brands", "icon": "verified", "link": "/admin/catalog/brand/"},
                ],
            },
            {
                "title": "OEM Catalogue",
                "separator": True,
                "items": [
                    {"title": "OEM Parts", "icon": "inventory_2", "link": "/admin/oem/oempart/"},
                    {"title": "Vehicle Makes", "icon": "factory", "link": "/admin/oem/vehiclemake/"},
                    {"title": "Vehicle Models", "icon": "model_training", "link": "/admin/oem/vehiclemodel/"},
                    {"title": "Reg. Lookups", "icon": "pin", "link": "/admin/oem/registrationlookup/"},
                ],
            },
            {
                "title": "Sales & Fulfilment",
                "separator": True,
                "items": [
                    {"title": "Orders", "icon": "receipt_long", "link": "/admin/orders/order/"},
                    {"title": "Carts", "icon": "shopping_cart", "link": "/admin/orders/cart/"},
                    {"title": "Inquiries", "icon": "forum", "link": "/admin/orders/inquiry/", "badge": "karbadi.settings._badge_open_inquiries"},
                    {"title": "Shipments", "icon": "local_shipping", "link": "/admin/shipping/shipment/"},
                    {"title": "Couriers", "icon": "hub", "link": "/admin/shipping/courier/"},
                    {"title": "Courier Rules", "icon": "rule", "link": "/admin/shipping/courierrule/"},
                ],
            },
            {
                "title": "Accounts",
                "separator": True,
                "items": [
                    {"title": "Users", "icon": "person", "link": "/admin/accounts/user/"},
                    {"title": "Seller Profiles", "icon": "storefront", "link": "/admin/accounts/sellerprofile/"},
                    {"title": "Addresses", "icon": "home", "link": "/admin/accounts/address/"},
                ],
            },
        ],
    },
}
