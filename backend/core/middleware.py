from django.utils.deprecation import MiddlewareMixin

from django.conf import settings

class RemoveXFrameOptionsMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Define allowed domains for iframe embedding (Production + Dev)
        allowed_origins = [
            "'self'",
            "https://cms.2kvl.tech",
            "https://crm-perso.vercel.app",
        ]
        
        if settings.DEBUG:
             # Allow any localhost port in dev
             allowed_origins.append("http://localhost:*")
             allowed_origins.append("http://127.0.0.1:*")
             allowed_origins.append("http://192.168.1.36:*")
             
             # In dev, we can also just strip XFO to be sure, though CSP usually wins
             if 'X-Frame-Options' in response.headers:
                del response.headers['X-Frame-Options']
             if 'X-Frame-Options' in response:
                del response['X-Frame-Options']

        # Construct CSP header
        # frame-ancestors controls who can embed this site
        csp_value = f"frame-ancestors {' '.join(allowed_origins)};"
        response['Content-Security-Policy'] = csp_value
        
        return response

from rest_framework_simplejwt.authentication import JWTAuthentication

class JWTAuthMiddleware(MiddlewareMixin):
    """
    Middleware to force JWT authentication before crum middleware runs.
    This ensures get_current_user() works nicely with DRF and SimpleJWT.
    """
    def process_request(self, request):
        if not getattr(request, 'user', None) or not request.user.is_authenticated:
            try:
                auth = JWTAuthentication()
                auth_tuple = auth.authenticate(request)
                if auth_tuple:
                    request.user = auth_tuple[0]
            except Exception:
                pass
