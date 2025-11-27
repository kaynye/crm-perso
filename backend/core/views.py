from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from rest_framework import viewsets
from .serializers import UserSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from pages.models import Page
from crm.models import Company, Contact
from tasks.models import Task

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = (AllowAny,)

class MentionSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        results = []

        # Search Pages
        pages = Page.objects.filter(title__icontains=query)[:5]
        for page in pages:
            results.append({
                'id': str(page.id),
                'type': 'page',
                'label': page.title,
                'url': f'/pages/{page.id}'
            })

        # Search Companies
        companies = Company.objects.filter(name__icontains=query)[:5]
        for company in companies:
            results.append({
                'id': str(company.id),
                'type': 'company',
                'label': company.name,
                'url': f'/crm/companies/{company.id}'
            })

        # Search Contacts
        contacts = Contact.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )[:5]
        for contact in contacts:
            results.append({
                'id': str(contact.id),
                'type': 'contact',
                'label': f"{contact.first_name} {contact.last_name}",
                'url': f'/crm/contacts/{contact.id}'
            })

        # Search Tasks
        tasks = Task.objects.filter(title__icontains=query)[:5]
        for task in tasks:
            results.append({
                'id': str(task.id),
                'type': 'task',
                'label': task.title,
                'url': f'/tasks' # Task board doesn't have detail view yet, maybe add query param?
            })

        return Response(results)

class GlobalSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        if not query:
            return Response([])

        results = []

        # Search Pages
        pages = Page.objects.filter(title__icontains=query)[:5]
        for page in pages:
            results.append({
                'id': str(page.id),
                'type': 'page',
                'title': page.title,
                'subtitle': 'Page',
                'url': f'/pages/{page.id}'
            })

        # Search Databases
        from databases.models import Database
        databases = Database.objects.filter(title__icontains=query)[:5]
        for db in databases:
            results.append({
                'id': str(db.id),
                'type': 'database',
                'title': db.title,
                'subtitle': 'Database',
                'url': f'/databases/{db.id}'
            })

        # Search Companies
        companies = Company.objects.filter(name__icontains=query)[:5]
        for company in companies:
            results.append({
                'id': str(company.id),
                'type': 'company',
                'title': company.name,
                'subtitle': 'Company',
                'url': f'/crm/companies/{company.id}'
            })

        # Search Contacts
        contacts = Contact.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )[:5]
        for contact in contacts:
            results.append({
                'id': str(contact.id),
                'type': 'contact',
                'title': f"{contact.first_name} {contact.last_name}",
                'subtitle': contact.position or 'Contact',
                'url': f'/crm/contacts/{contact.id}'
            })

        # Search Tasks
        tasks = Task.objects.filter(title__icontains=query)[:5]
        for task in tasks:
            results.append({
                'id': str(task.id),
                'type': 'task',
                'title': task.title,
                'subtitle': f"Task ({task.status})",
                'url': f'/tasks'
            })

        return Response(results)

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Recent Pages
        recent_pages = Page.objects.order_by('-updated_at')[:5]
        recent_pages_data = [{
            'id': str(p.id),
            'title': p.title,
            'updated_at': p.updated_at
        } for p in recent_pages]

        # My Tasks
        my_tasks = Task.objects.filter(assigned_to=request.user).exclude(status='done').order_by('due_date')[:5]
        my_tasks_data = [{
            'id': str(t.id),
            'title': t.title,
            'status': t.status,
            'priority': t.priority,
            'due_date': t.due_date
        } for t in my_tasks]

        # Active Contracts
        from crm.models import Contract
        active_contracts = Contract.objects.filter(status='active').order_by('end_date')[:5]
        active_contracts_data = [{
            'id': str(c.id),
            'title': c.title,
            'company': c.company.name,
            'end_date': c.end_date,
            'amount': c.amount
        } for c in active_contracts]

        # Analytics - Revenue (Last 6 months)
        from django.db.models import Sum, Count
        from django.db.models.functions import TruncMonth
        from django.utils import timezone
        from datetime import timedelta
        import locale
        
        # French month names mapping
        MONTHS_FR = {
            1: 'Janv', 2: 'Févr', 3: 'Mars', 4: 'Avr', 5: 'Mai', 6: 'Juin',
            7: 'Juil', 8: 'Août', 9: 'Sept', 10: 'Oct', 11: 'Nov', 12: 'Déc'
        }

        six_months_ago = timezone.now() - timedelta(days=180)
        revenue_data = Contract.objects.filter(
            status='signed', 
            created_at__gte=six_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Sum('amount')
        ).order_by('month')
        
        revenue_chart = [
            {
                'name': MONTHS_FR[item['month'].month], 
                'value': item['total'] or 0
            } for item in revenue_data
        ]

        # Analytics - Task Distribution
        task_counts = Task.objects.values('status').annotate(count=Count('id'))
        
        TASK_STATUS_FR = {
            'todo': 'À faire',
            'in_progress': 'En cours',
            'done': 'Terminé',
            'blocked': 'Bloqué'
        }
        
        task_chart = [
            {
                'name': TASK_STATUS_FR.get(item['status'], item['status']), 
                'value': item['count']
            } for item in task_counts
        ]

        # Analytics - Sales Funnel (Contracts by status)
        funnel_counts = Contract.objects.values('status').annotate(count=Count('id'))
        # Order: Draft -> Active -> Signed -> Finished
        status_order = ['draft', 'active', 'signed', 'finished']
        
        CONTRACT_STATUS_FR = {
            'draft': 'Brouillon',
            'active': 'Actif',
            'signed': 'Signé',
            'finished': 'Terminé'
        }
        
        funnel_map = {item['status']: item['count'] for item in funnel_counts}
        funnel_chart = [
            {
                'name': CONTRACT_STATUS_FR.get(status, status), 
                'value': funnel_map.get(status, 0)
            } for status in status_order
        ]

        return Response({
            'recent_pages': recent_pages_data,
            'my_tasks': my_tasks_data,
            'active_contracts': active_contracts_data,
            'analytics': {
                'revenue': revenue_chart,
                'tasks': task_chart,
                'funnel': funnel_chart
            }
        })

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    from django.contrib.auth import get_user_model
    queryset = get_user_model().objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os

class UploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if 'image' not in request.FILES and 'file' not in request.FILES:
            return Response({'success': 0, 'error': 'No file uploaded'})

        file = request.FILES.get('image') or request.FILES.get('file')
        
        # Save file
        path = default_storage.save(f'uploads/{file.name}', ContentFile(file.read()))
        url = request.build_absolute_uri(default_storage.url(path))

        return Response({
            'success': 1,
            'file': {
                'url': url,
                'name': file.name,
                'size': file.size
            }
        })
