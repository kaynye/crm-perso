from django.utils import timezone
from crm.models import Meeting, Company
from datetime import datetime

class MeetingTools:
    @staticmethod
    def create_meeting(title, company_name, date, type='video', notes='', user=None):
        """
        Creates a new meeting for a company.
        """
        # Find company
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        company = Company.objects.filter(name__icontains=company_name, organization=user.organization).first()
        if not company:
            return f"Entreprise '{company_name}' introuvable. Veuillez d'abord la créer."

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
                        return f"Format de date invalide : {date}. Veuillez utiliser AAAA-MM-JJ HH:MM:SS"

        meeting = Meeting.objects.create(
            title=title,
            company=company,
            date=meeting_date,
            type=type,
            notes=notes,
            created_by=user,
            organization=user.organization
        )

        return {
            "message": f"Réunion '{title}' planifiée avec {company.name} le {meeting_date}.",
            "action": {
                "type": "NAVIGATE",
                "label": "Voir la réunion",
                "url": f"/crm/meetings/{meeting.id}"
            }
        }
