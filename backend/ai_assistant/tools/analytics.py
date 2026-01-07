from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from crm.models import Company, Contract, Meeting
from tasks.models import Task

class AnalyticsTools:
    @staticmethod
    def analyze_data(entity_type, metric='count', time_period=None, filters=None, user=None):
        """
        Performs analysis on data.
        entity_type: 'company', 'contract', 'task', 'meeting'
        metric: 'count', 'sum_amount' (for contracts)
        time_period: 'this_month', 'last_month', 'this_year', 'all_time'
        filters: dict of additional filters (e.g. {'status': 'signed'})
        """
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation. Utilisateur non authentifié."
            
        queryset = None
        if entity_type == 'company':
            queryset = Company.objects.filter(organization=user.organization)
        elif entity_type == 'contract':
            queryset = Contract.objects.filter(organization=user.organization)
        elif entity_type == 'task':
            queryset = Task.objects.filter(organization=user.organization)
        elif entity_type == 'meeting':
            queryset = Meeting.objects.filter(organization=user.organization)
            
        if queryset is None:
            return f"Unknown entity type: {entity_type}"

        # Apply Time Filter
        now = timezone.now()
        date_field = 'created_at' # Default
        
        if entity_type == 'contract':
            date_field = 'start_date'
        elif entity_type == 'meeting':
            date_field = 'date'
        elif entity_type == 'task':
            date_field = 'due_date'

        if time_period == 'this_month':
            queryset = queryset.filter(**{f"{date_field}__month": now.month, f"{date_field}__year": now.year})
        elif time_period == 'last_month':
            last_month = now.replace(day=1) - timedelta(days=1)
            queryset = queryset.filter(**{f"{date_field}__month": last_month.month, f"{date_field}__year": last_month.year})
        elif time_period == 'this_year':
            queryset = queryset.filter(**{f"{date_field}__year": now.year})

        # Apply Custom Filters
        if filters:
            # Clean filters
            clean_filters = {}
            for k, v in filters.items():
                if v and v != 'any':
                    if k == 'company' or k == 'company_name':
                        # Handle company name or ID
                        if isinstance(v, int) or (isinstance(v, str) and v.isdigit()):
                            clean_filters['company__id'] = v
                        else:
                            clean_filters['company__name__icontains'] = v
                    else:
                        clean_filters[k] = v
            queryset = queryset.filter(**clean_filters)

        # Calculate Metric
        if metric == 'count':
            count = queryset.count()
            return f"Total {entity_type}s ({time_period or 'tout le temps'}): {count}"
        
        elif metric == 'sum_amount' and entity_type == 'contract':
            total = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
            return f"Montant total des contrats ({time_period or 'tout le temps'}): {total} €"
            
        elif metric == 'urgent_tasks' and entity_type == 'task':
            # Special metric for "urgent tasks"
            tasks = queryset.filter(priority='high', status__in=['todo', 'in_progress'])
            count = tasks.count()
            
            if count == 0:
                return "Vous n'avez aucune tâche urgente."
                
            task_list = "\n".join([f"- {t.title} (Échéance : {t.due_date.strftime('%d/%m/%Y') if t.due_date else 'Aucune'})" for t in tasks])
            return f"Vous avez {count} tâches urgentes :\n{task_list}"
            
        elif metric == 'top_clients_revenue':
            # Top clients by signed contract amount
            top_companies = Contract.objects.filter(
                organization=user.organization, 
                status='signed'
            ).values('company__name').annotate(total_revenue=Sum('amount')).order_by('-total_revenue')[:5]
            
            if not top_companies:
                return "Aucun revenu trouvé (contrats signés)."
                
            report = "Top Clients par Revenu (Contrats Signés) :\n"
            for c in top_companies:
                report += f"- {c['company__name']}: {c['total_revenue']} €\n"
            return report
 
        elif metric == 'top_clients_activity':
            # Top clients by meetings count
            top_companies = Meeting.objects.filter(
                organization=user.organization
            ).values('company__name').annotate(total_meetings=Count('id')).order_by('-total_meetings')[:5]
            
            if not top_companies:
                return "Aucune activité de réunion trouvée."
                
            report = "Top Clients par Activité (Réunions) :\n"
            for c in top_companies:
                report += f"- {c['company__name']}: {c['total_meetings']} réunions\n"
            return report

        return f"Analyse terminée. Résultat : {queryset.count()}"
