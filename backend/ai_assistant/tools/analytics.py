from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from crm.models import Company, Contract, Meeting
from tasks.models import Task

class AnalyticsTools:
    @staticmethod
    def analyze_data(entity_type, metric='count', time_period=None, filters=None):
        """
        Performs analysis on data.
        entity_type: 'company', 'contract', 'task', 'meeting'
        metric: 'count', 'sum_amount' (for contracts)
        time_period: 'this_month', 'last_month', 'this_year', 'all_time'
        filters: dict of additional filters (e.g. {'status': 'signed'})
        """
        queryset = None
        if entity_type == 'company':
            queryset = Company.objects.all()
        elif entity_type == 'contract':
            queryset = Contract.objects.all()
        elif entity_type == 'task':
            queryset = Task.objects.all()
        elif entity_type == 'meeting':
            queryset = Meeting.objects.all()
            
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
            date_field = 'created_at' # or due_date? Let's stick to created_at for "new tasks" logic, or handle specific queries later.

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
                    if k == 'company':
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
            return f"Total {entity_type}s ({time_period or 'all time'}): {count}"
        
        elif metric == 'sum_amount' and entity_type == 'contract':
            total = queryset.aggregate(Sum('amount'))['amount__sum'] or 0
            return f"Total amount of contracts ({time_period or 'all time'}): {total} €"
            
        elif metric == 'urgent_tasks' and entity_type == 'task':
            # Special metric for "urgent tasks"
            tasks = queryset.filter(priority='high', status__in=['todo', 'in_progress'])
            count = tasks.count()
            
            if count == 0:
                return "You have no urgent tasks."
                
            task_list = "\n".join([f"- {t.title} (Due: {t.due_date.strftime('%Y-%m-%d') if t.due_date else 'No date'})" for t in tasks])
            return f"You have {count} urgent tasks:\n{task_list}"

        return f"Analysis completed. Count: {queryset.count()}"
