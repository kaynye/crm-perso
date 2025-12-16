from rest_framework.exceptions import PermissionDenied

class OrganizationScopeMixin:
    """
    Mixin to ensure objects are filtered by the user's organization.
    Also ensures created objects are assigned to the user's organization.
    """
    def get_queryset(self):
        if self.request.user.organization:
            return super().get_queryset().filter(organization=self.request.user.organization)

        # Allow superusers to see everything (optional, but good for admin)
        if self.request.user.is_superuser:
            return super().get_queryset()

        raise PermissionDenied("User does not belong to an organization.")

    def perform_create(self, serializer):
        if not self.request.user.organization:
            raise PermissionDenied("User does not belong to an organization.")
            
        serializer.save(organization=self.request.user.organization)
