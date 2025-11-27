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
            # Assuming meeting is linked to a company, we might want to add contact emails
            # This logic can be expanded. For now, let's just add the user.
            
            event = {
                'summary': meeting.title,
                'location': 'Online' if meeting.type == 'video' else meeting.company.address,
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
