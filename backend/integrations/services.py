import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from django.conf import settings
from .models import UserIntegration

class GoogleCalendarService:
    SCOPES = ['https://www.googleapis.com/auth/calendar']

    @staticmethod
    def get_credentials(user):
        try:
            integration = user.integration
            if not integration.google_access_token:
                return None
            
            creds = Credentials(
                token=integration.google_access_token,
                refresh_token=integration.google_refresh_token,
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.getenv('GOOGLE_CLIENT_ID'),
                client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
                scopes=GoogleCalendarService.SCOPES
            )
            return creds
        except UserIntegration.DoesNotExist:
            return None

    @staticmethod
    def create_event(user, meeting):
        creds = GoogleCalendarService.get_credentials(user)
        if not creds:
            print(f"No Google credentials for user {user.email}")
            return None

        try:
            service = build('calendar', 'v3', credentials=creds)
            
            # Prepare event body
            start_time = meeting.date.isoformat()
            end_time = (meeting.date + datetime.timedelta(hours=1)).isoformat() # Default 1h duration
            
            description = meeting.notes
            if meeting.contract:
                description += f"\n\nContract: {meeting.contract.title}"
            
            attendees = []
            # Assuming meeting is linked to a space, we might want to add contact emails
            # This logic can be expanded. For now, let's just add the user.
            
            event = {
                'summary': meeting.title,
                'location': 'Online' if meeting.type == 'video' else meeting.space.address,
                'description': description,
                'start': {
                    'dateTime': start_time,
                    'timeZone': 'UTC', # Should ideally use user's timezone
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': 'UTC',
                },
                # 'attendees': attendees,
            }

            event = service.events().insert(calendarId='primary', body=event).execute()
            print(f"Event created: {event.get('htmlLink')}")
            return event.get('id')

        except Exception as e:
            print(f"Error creating Google Calendar event: {str(e)}")
            return None

import requests

class GithubService:
    BASE_URL = "https://api.github.com"

    @staticmethod
    def get_token(user):
        try:
            return user.integration.github_access_token
        except UserIntegration.DoesNotExist:
            return None

    @staticmethod
    def _headers(token):
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
        }

    @staticmethod
    def get_user_and_repos(user):
        """Fetch user info and their accessible repositories"""
        token = GithubService.get_token(user)
        if not token:
            return None

        # Get user profile
        user_resp = requests.get(f"{GithubService.BASE_URL}/user", headers=GithubService._headers(token))
        if not user_resp.ok:
            return None
            
        user_info = user_resp.json()
        
        # Get repos (user's and those they have access to)
        # Using pagination could be necessary for users with many repos, but standard get usually returns 30
        repos_resp = requests.get(
            f"{GithubService.BASE_URL}/user/repos?sort=updated&per_page=100", 
            headers=GithubService._headers(token)
        )
        repos = repos_resp.json() if repos_resp.ok else []

        # Return a unified object
        return {
            "profile": user_info,
            "repos": [{"full_name": r["full_name"], "private": r["private"], "updated_at": r["updated_at"]} for r in repos]
        }

    @staticmethod
    def get_repo_branches(user, repo_full_name):
        token = GithubService.get_token(user)
        if not token:
            return []

        resp = requests.get(
            f"{GithubService.BASE_URL}/repos/{repo_full_name}/branches",
            headers=GithubService._headers(token)
        )
        return resp.json() if resp.ok else []

    @staticmethod
    def get_repo_commits(user, repo_full_name, branch='main'):
        token = GithubService.get_token(user)
        if not token:
            return []

        resp = requests.get(
            f"{GithubService.BASE_URL}/repos/{repo_full_name}/commits?sha={branch}&per_page=50",
            headers=GithubService._headers(token)
        )
        if not resp.ok:
            return []
            
        data = resp.json()
        return [
            {
                "sha": c["sha"],
                "message": c["commit"]["message"],
                "author": c["commit"]["author"]["name"],
                "date": c["commit"]["author"]["date"],
                "url": c["html_url"],
                "avatar_url": c["author"]["avatar_url"] if c.get("author") else None
            }
            for c in data
        ]

    @staticmethod
    def get_repo_stats(user, repo_full_name):
        token = GithubService.get_token(user)
        if not token:
            return None

        # Get general repo info
        repo_resp = requests.get(
            f"{GithubService.BASE_URL}/repos/{repo_full_name}",
            headers=GithubService._headers(token)
        )
        if not repo_resp.ok:
            return None
            
        repo_data = repo_resp.json()
        
        # We can also get contributor stats if needed (can be slow/cached)
        # Using simply recent commit count for this week as an alternative, or just stars/forks/open_issues
        
        return {
            "stars": repo_data.get("stargazers_count", 0),
            "forks": repo_data.get("forks_count", 0),
            "open_issues": repo_data.get("open_issues_count", 0),
            "language": repo_data.get("language", ""),
            "updated_at": repo_data.get("updated_at", "")
        }

    @staticmethod
    def get_repo_releases(user, repo_full_name):
        token = GithubService.get_token(user)
        if not token:
            return []

        resp = requests.get(
            f"{GithubService.BASE_URL}/repos/{repo_full_name}/releases?per_page=10",
            headers=GithubService._headers(token)
        )
        
        if not resp.ok:
            return []
            
        return [
            {
                "id": r["id"],
                "name": r["name"] or r["tag_name"],
                "tag_name": r["tag_name"],
                "published_at": r["published_at"],
                "body": r["body"],
                "author": r["author"]["login"],
                "url": r["html_url"]
            }
            for r in resp.json()
        ]

