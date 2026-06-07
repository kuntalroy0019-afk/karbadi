from rest_framework import permissions


class IsSellerOrReadOnly(permissions.BasePermission):
    """Anyone can read; only authenticated sellers can create/own listings."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and user.is_seller)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id or request.user.is_staff


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Anyone can read; ANY authenticated user can create (C2C);
    only the listing's owner (or staff) can edit/delete it.

    Used for whole-vehicle buy/sell, where a regular user sells their own car —
    unlike parts, which are dealer-only (IsSellerOrReadOnly).
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id or request.user.is_staff
