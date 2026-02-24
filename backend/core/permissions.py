from rest_framework import permissions
from django.conf import settings

class HasGeminiSecret(permissions.BasePermission):
    """
    Allows access only if the 'X-Gemini-Secret' header matches the configured secret.
    """

    def has_permission(self, request, view):
        # Allow if user is authenticated (admin panel, etc.)
        if request.user and request.user.is_authenticated:
            return True
            
        secret = request.headers.get('X-Gemini-Secret')
        expected_secret = getattr(settings, 'GEMINI_SECRET_KEY', None)
        
        if not expected_secret:
            return False

        return secret == expected_secret

class SpaceRolePermission(permissions.BasePermission):
    """
    Checks if a user has the appropriate role within a Space to perform an action.
    - Spectator (or any member): Read-only (GET, HEAD, OPTIONS)
    - Editor: Read + Write (POST, PUT, PATCH), but no delete or member management.
    - Admin: Full access (All methods, plus member management).
    """
    
    def has_permission(self, request, view):
        # We handle object-level permissions in has_object_permission
        # However, for creating objects (POST), we might need to check the space ID in data
        if request.method == 'POST' and 'space' in request.data:
            space_id = request.data.get('space')
            if not space_id: return True # Could be global object
            
            from crm.models import SpaceMember
            member = SpaceMember.objects.filter(space_id=space_id, user=request.user).first()
            
            if not member:
                return False
                
            # Spectators cannot create
            if member.role == 'spectator':
                return False
                
        return True

    def has_object_permission(self, request, view, obj):
        from crm.models import Space, SpaceMember
        
        # Determine the space associated with the object
        space = None
        if isinstance(obj, Space):
            space = obj
        elif hasattr(obj, 'space'):
            space = obj.space
            
        if not space:
            return True # Not a space-scoped object
            
        member = SpaceMember.objects.filter(space=space, user=request.user).first()
        
        if not member:
            return False # Not a member of this space
            
        # Safe methods (GET, HEAD, OPTIONS) are allowed for any member (Spectator, Editor, Admin)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # DELETE operations are usually restricted to Admin
        if request.method == 'DELETE':
            return member.role == 'admin'
            
        # PUT/PATCH are allowed for Editor and Admin, NOT Spectator
        if request.method in ['PUT', 'PATCH']:
            return member.role in ['admin', 'editor']
            
        return False
