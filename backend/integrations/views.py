import os
from django.shortcuts import redirect
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from google_auth_oauthlib.flow import Flow
from .models import UserIntegration

class GoogleAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                    "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=['https://www.googleapis.com/auth/calendar'],
            redirect_uri='http://localhost:5173/google/callback' # Frontend URL
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true'
        )
        
        # Store state in session to verify callback (optional but recommended)
        # For simplicity, we might skip state verification or store it in a simple way
        # But we need to know WHICH user initiated this.
        # Since the callback comes from Google, we lose the request.user context if we don't use session.
        # We'll rely on the session cookie which should persist.
        request.session['google_oauth_state'] = state
        
        return Response({'url': authorization_url})

class GoogleCallbackView(APIView):
    # Callback comes from Google, so no Auth header usually. 
    # But we need to identify the user. 
    # Typically this is done via session cookie.
    # If using JWT, it's harder.
    # A common trick is to pass the JWT token in the 'state' parameter, but state is for CSRF.
    # Alternatively, the frontend handles the redirect and sends the code to the backend with the Auth header.
    # Let's try the frontend-handling approach:
    # 1. Frontend calls AuthView -> gets URL.
    # 2. Frontend redirects user to URL.
    # 3. Google redirects to Frontend Callback Page (e.g. localhost:5173/google/callback?code=...)
    # 4. Frontend calls Backend Callback API with code AND Auth Header.
    
    # So this view should accept POST with 'code'.
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Allow HTTP for localhost
        os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
        
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=400)

        try:
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": os.getenv('GOOGLE_CLIENT_ID'),
                        "client_secret": os.getenv('GOOGLE_CLIENT_SECRET'),
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=['https://www.googleapis.com/auth/calendar'],
                redirect_uri='http://localhost:5173/google/callback' # Frontend URL
            )
            
            flow.fetch_token(code=code)
            credentials = flow.credentials
            
            # Handle timezone for expiry
            from django.utils import timezone
            expiry = credentials.expiry
            if expiry and expiry.tzinfo is None:
                expiry = timezone.make_aware(expiry)

            # Save credentials
            UserIntegration.objects.update_or_create(
                user=request.user,
                defaults={
                    'google_access_token': credentials.token,
                    'google_refresh_token': credentials.refresh_token,
                    'google_token_expiry': expiry
                }
            )
            
            return Response({'status': 'success', 'message': 'Google Calendar connected!'})
            
        except Exception as e:
            import traceback
            traceback.print_exc() # Print to console
            return Response({'error': str(e)}, status=500)
