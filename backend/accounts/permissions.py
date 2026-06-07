from rest_framework import permissions


class IsProfileOwnerOrReadOnly(permissions.BasePermission):
    """Only the storefront's owner (or staff) may modify it."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user_id == request.user.id or request.user.is_staff
