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
