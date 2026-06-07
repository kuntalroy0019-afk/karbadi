"""Backend-served dummy images.

Until a real photo is uploaded (to Cloudinary or local media), the API fills
image fields with a stable, auto-themed placeholder chosen *server-side* from a
verified Unsplash pool. Selection is deterministic per object (seeded by id), so
an item always shows the same picture across reloads.

Everything flows through these helpers — the apps never hardcode placeholders —
so swapping to real images later is automatic (an uploaded file always wins).
"""

# Verified-reachable Unsplash CDN photo IDs (cars / engines / auto parts).
_AUTO_POOL = [
    "1486262715619-67b85e0b08d3",
    "1492144534655-ae79c964c9d7",
    "1503376780353-7e6692767b70",
    "1552519507-da3b142c6e3d",
    "1605559424843-9e4c228bf1c2",
    "1542362567-b07e54358753",
    "1487754180451-c456f719a1fc",
    "1568605117036-5fe5e7bab0b7",
    "1449965408869-eaa3f722e40d",
    "1503736334956-4c8f8e92946d",
]


def _hash(text, mod):
    h = 0
    for ch in str(text):
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    return h % mod


def _unsplash(seed, w=600, h=600):
    pid = _AUTO_POOL[_hash(seed, len(_AUTO_POOL))]
    return f"https://images.unsplash.com/photo-{pid}?w={w}&h={h}&fit=crop&q=70"


def part_image(seed):
    return _unsplash(f"part-{seed}", 600, 600)


def vehicle_image(seed):
    return _unsplash(f"veh-{seed}", 800, 500)


def oem_image(seed):
    return _unsplash(f"oem-{seed}", 600, 600)


def logo_image(seed, text=""):
    """Initials avatar for shops/brands (deterministic, reliable)."""
    label = (text or str(seed)).strip()[:2].upper() or "KB"
    return f"https://ui-avatars.com/api/?name={label}&size=256&background=1565FF&color=fff&bold=true"
