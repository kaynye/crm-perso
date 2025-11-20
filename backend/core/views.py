from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
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

        return Response({
            'recent_pages': recent_pages_data,
            'my_tasks': my_tasks_data
        })
