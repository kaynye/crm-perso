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

class GithubAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client_id = os.getenv('GITHUB_CLIENT_ID')
        # We request 'repo' scope to access private repositories
        redirect_uri = 'http://localhost:5173/github/callback'
        url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=repo&redirect_uri={redirect_uri}"
        return Response({'url': url})

class GithubCallbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'No code provided'}, status=400)

        client_id = os.getenv('GITHUB_CLIENT_ID')
        client_secret = os.getenv('GITHUB_CLIENT_SECRET')

        # Exchange code for token
        import requests
        token_resp = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': client_id,
                'client_secret': client_secret,
                'code': code,
            },
            headers={'Accept': 'application/json'}
        )

        if not token_resp.ok:
            return Response({'error': 'Failed to fetch token from GitHub'}, status=400)

        token_data = token_resp.json()
        access_token = token_data.get('access_token')

        if not access_token:
            return Response({'error': 'No access token received'}, status=400)

        # Get github username to save it
        user_resp = requests.get('https://api.github.com/user', headers={
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/vnd.github.v3+json'
        })
        github_username = user_resp.json().get('login') if user_resp.ok else None

        # Save credentials
        UserIntegration.objects.update_or_create(
            user=request.user,
            defaults={
                'github_access_token': access_token,
                'github_username': github_username,
            }
        )

        return Response({'status': 'success', 'message': 'GitHub connected!'})

from .services import GithubService

class GithubDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        action = request.query_params.get('action')
        
        if action == 'repos':
            data = GithubService.get_user_and_repos(request.user)
            if not data:
                return Response({'error': 'GitHub not connected or token invalid'}, status=400)
            return Response(data)
            
        elif action == 'branches':
            repo = request.query_params.get('repo')
            if not repo:
                return Response({'error': 'repo parameter missing'}, status=400)
            branches = GithubService.get_repo_branches(request.user, repo)
            return Response(branches)
            
        elif action == 'commits':
            repo = request.query_params.get('repo')
            branch = request.query_params.get('branch', 'main')
            if not repo:
                return Response({'error': 'repo parameter missing'}, status=400)
            commits = GithubService.get_repo_commits(request.user, repo, branch)
            return Response(commits)

        elif action == 'stats':
            repo = request.query_params.get('repo')
            if not repo:
                return Response({'error': 'repo parameter missing'}, status=400)
            stats = GithubService.get_repo_stats(request.user, repo)
            return Response(stats)

        elif action == 'releases':
            repo = request.query_params.get('repo')
            if not repo:
                return Response({'error': 'repo parameter missing'}, status=400)
            releases = GithubService.get_repo_releases(request.user, repo)
            return Response(releases)
            
        return Response({'error': 'Invalid action'}, status=400)

import hmac
import hashlib
from crm.models import Space, ActivityLog
from core.models import User
from rest_framework.permissions import AllowAny

class GithubWebhookView(APIView):
    permission_classes = [AllowAny] # GitHub will call this without user token

    def post(self, request):
        # Optional: verify github signature if secret is set
        secret = os.getenv('GITHUB_WEBHOOK_SECRET')
        if secret:
            signature = request.headers.get('X-Hub-Signature-256')
            if not signature:
                return Response({'error': 'Missing signature'}, status=403)
                
            expected_signature = 'sha256=' + hmac.new(
                secret.encode(), request.body, hashlib.sha256
            ).hexdigest()
            
            # Use constant time comparison
            if not hmac.compare_digest(expected_signature, signature):
                return Response({'error': 'Invalid signature'}, status=403)

        event_type = request.headers.get('X-GitHub-Event', 'ping')
        
        if event_type == 'ping':
            return Response({'status': 'pong'})
            
        if event_type == 'push':
            payload = request.data
            repo_full_name = payload.get('repository', {}).get('full_name')
            pusher_name = payload.get('pusher', {}).get('name', 'Unknown')
            commits = payload.get('commits', [])
            ref = payload.get('ref', '')
            branch = ref.split('/')[-1] if ref else 'unknown'
            
            if not repo_full_name or not commits:
                return Response({'status': 'ignored', 'reason': 'Missing repo or commits'})
                
            # Find all spaces connected to this repository
            spaces = Space.objects.filter(github_repo=repo_full_name)
            
            if not spaces.exists():
                return Response({'status': 'ignored', 'reason': 'No matching space found'})

            # Try to infer actor from github username if they are in the database
            actor = None
            try:
                # We can try to look up by UserIntegration, but webhooks don't tell us WHICH of our users pushed.
                # It just tells us the GitHub username/email.
                integration = UserIntegration.objects.filter(github_username=pusher_name).first()
                if integration:
                    actor = integration.user
            except Exception:
                pass

            commit_count = len(commits)
            commit_text = "commit" if commit_count == 1 else "commits"
            
            details = {
                "branch": branch,
                "commits": [{"id": c["id"][:7], "message": c["message"]} for c in commits[:5]], # Store up to 5 commits
                "total_commits": commit_count,
                "pusher": pusher_name,
                "compare_url": payload.get('compare', '')
            }
            
            # Create an ActivityLog for each matching space
            for space in spaces:
                ActivityLog.objects.create(
                    space=space,
                    actor=actor, # Can be None if system/unknown user
                    action='github_push',
                    entity_type='github_repo',
                    entity_name=repo_full_name,
                    details=details
                )
                
            return Response({'status': 'success', 'spaces_updated': spaces.count()})
            
        return Response({'status': 'ignored', 'event': event_type})

