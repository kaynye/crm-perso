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
