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
