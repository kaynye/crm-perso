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
