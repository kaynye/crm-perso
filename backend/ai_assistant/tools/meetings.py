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
    @staticmethod
    def list_meetings(company_name=None, date_range=None, limit=5, user=None):
        """Lists meetings with filters."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."
            
        meetings = Meeting.objects.filter(organization=user.organization).order_by('-date')
        
        if company_name:
            meetings = meetings.filter(company__name__icontains=company_name)
            
        now = timezone.now()
        if date_range == 'upcoming':
            meetings = meetings.filter(date__gte=now).order_by('date')
        elif date_range == 'past':
            meetings = meetings.filter(date__lt=now)
        elif date_range == 'today':
            start_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_day = now.replace(hour=23, minute=59, second=59, microsecond=999999)
            meetings = meetings.filter(date__range=[start_day, end_day])
            
        count = meetings.count()
        if count == 0:
            return "Aucune réunion trouvée."
            
        meetings = meetings[:limit]
        meeting_list = []
        for m in meetings:
             company_str = m.company.name if m.company else "Sans entreprise"
             date_str = m.date.strftime('%d/%m/%Y %H:%M')
             meeting_list.append(f"- {m.title} avec {company_str} le {date_str} ({m.type})")
             
        return f"Réunions trouvées ({count} total) :\n" + "\n".join(meeting_list)
