"""Karbadi root URL configuration."""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(_request):
    return JsonResponse({
        "name": "Karbadi API",
        "tagline": "Every Car, Every Part",
        "version": "1.0",
        "endpoints": {
            "auth": "/api/auth/",
            "catalog": "/api/catalog/",
            "oem": "/api/oem/",
            "orders": "/api/orders/",
            "shipping": "/api/shipping/",
            "admin": "/admin/",
        },
    })


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/oem/", include("oem.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/shipping/", include("shipping.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
