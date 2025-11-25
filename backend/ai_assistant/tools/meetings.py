from django.utils import timezone
from crm.models import Meeting, Company
from datetime import datetime

class MeetingTools:
    @staticmethod
    def create_meeting(title, company_name, date, type='video', notes=''):
        """
        Creates a new meeting for a company.
        """
        # Find company
        company = Company.objects.filter(name__icontains=company_name).first()
        if not company:
            return f"Company '{company_name}' not found. Please create it first."

        # Parse date if string
        if isinstance(date, str):
            try:
                # Try parsing ISO format first
                meeting_date = datetime.fromisoformat(date)
            except ValueError:
                # Fallback or assume it's already a datetime object if passed from services
                # But services passes strings from JSON.
                # If the LLM follows instructions, it sends YYYY-MM-DD.
                # But for meetings we need time too.
                # Let's assume the LLM sends ISO string YYYY-MM-DD HH:MM:SS
                try:
                    meeting_date = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
                except:
                    try:
                        meeting_date = datetime.strptime(date, '%Y-%m-%d')
                    except:
                        return f"Invalid date format: {date}. Please use YYYY-MM-DD HH:MM:SS"

        meeting = Meeting.objects.create(
            title=title,
            company=company,
            date=meeting_date,
            type=type,
            notes=notes
        )

        return {
            "message": f"Meeting '{title}' scheduled with {company.name} on {meeting_date}.",
            "action": {
                "type": "NAVIGATE",
                "label": "View Meeting",
                "url": f"/crm/meetings/{meeting.id}"
            }
        }
