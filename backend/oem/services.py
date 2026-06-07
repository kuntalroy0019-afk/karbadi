"""Oriparts OEM adapter + registration-number resolver.

Switchable between a mock provider (default, works offline) and a real
REST client once ORIPARTS credentials are configured. The smart-courier
and OEM modules are deliberately built behind adapters so the rest of the
app never touches a vendor SDK directly.
"""
import re

from django.conf import settings

from .models import OemPart, RegistrationLookup, VehicleModel


def _cfg():
    return settings.KARBADI


# --- Registration number resolution --------------------------------------
def resolve_registration(reg_number: str):
    """Resolve an Indian registration number -> {make, model, year, fuel}.

    Mock strategy: match the leading RTO prefix (e.g. 'MH12AB1234' -> 'MH12')
    against seeded RegistrationLookup rows. Real mode would call a VAHAN-style
    API exposed through Oriparts.
    """
    reg = re.sub(r"\s+", "", (reg_number or "")).upper()
    if not reg:
        return None

    # Try progressively shorter prefixes (4 -> 2 chars).
    for length in (6, 4, 2):
        prefix = reg[:length]
        match = (
            RegistrationLookup.objects.select_related(
                "vehicle_model", "vehicle_model__make"
            )
            .filter(prefix=prefix)
            .first()
        )
        if match:
            return {
                "registration_number": reg,
                "make": match.vehicle_model.make.name,
                "make_id": match.vehicle_model.make_id,
                "model": match.vehicle_model.name,
                "model_id": match.vehicle_model_id,
                "year": match.year,
                "fuel_type": match.fuel_type,
            }
    return None


# --- Catalogue sync -------------------------------------------------------
def sync_catalogue():
    """Background-job entrypoint to refresh the OEM catalogue.

    Mock mode is a no-op count. Real mode pulls Oriparts pages and upserts
    OemPart / Fitment rows. Wire this to a Celery beat / cron task.
    """
    if _cfg()["USE_MOCK_OEM"]:
        return {"mode": "mock", "synced": OemPart.objects.count()}

    # --- Real Oriparts pull would go here -------------------------------
    # import requests
    # token = _cfg()["ORIPARTS"]["API_KEY"]
    # resp = requests.get(f"{base}/catalogue", headers={"Authorization": ...})
    # for row in resp.json()["parts"]: upsert OemPart...
    raise NotImplementedError("Configure ORIPARTS_API_KEY and set USE_MOCK_OEM=False")
