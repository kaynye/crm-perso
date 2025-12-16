from rest_framework import viewsets, views, status, exceptions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from django.db.models import Q
from .models import SharedLink, Meeting, Document, MeetingTemplate
from tasks.models import Task
from .serializers import MeetingSerializer
from .serializers import DocumentSerializer
from .serializers import MeetingTemplateSerializer
from tasks.serializers import TaskSerializer

def get_link_or_403(token):
    if not token:
        raise exceptions.AuthenticationFailed("Token required")
    try:
        link = SharedLink.objects.get(token=token)
    except SharedLink.DoesNotExist:
        raise exceptions.AuthenticationFailed("Invalid token")
    
    if link.expires_at and link.expires_at < timezone.now():
        raise exceptions.AuthenticationFailed("Link expired")
        
    return link

class PublicSharedLinkView(views.APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        token = request.query_params.get('token')
        link = get_link_or_403(token)
        
        # Optional: Increment view count (beware of concurrent database locks, keeping it simple for now)
        # link.views_count += 1
        # link.save(update_fields=['views_count'])
        
        data = {
            "title": str(link.contract or link.company),
            "type": "contract" if link.contract else "company",
            "permissions": {
                "allow_tasks": link.allow_tasks,
                "allow_task_creation": link.allow_task_creation,
                "allow_meetings": link.allow_meetings,
                "allow_meeting_creation": link.allow_meeting_creation,
                "allow_documents": link.allow_documents,
                "allow_document_upload": link.allow_document_upload,
            },
            "company_name": link.company.name if link.company else (link.contract.company.name if link.contract else "Unknown"),
            "token": link.token
        }
        return Response(data)

class PublicTaskViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = TaskSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    
    def get_queryset(self):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_tasks:
            return Task.objects.none()
            
        if link.contract:
            return Task.objects.filter(contract=link.contract)
        elif link.company:
            # Include tasks directly linked to company OR via contracts of that company
            return Task.objects.filter(
                Q(company=link.company) | Q(contract__company=link.company)
            ).distinct()
        return Task.objects.none()

    def perform_create(self, serializer):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_tasks or not link.allow_task_creation:
            raise exceptions.PermissionDenied("Task creation not allowed")

        # Force status to draft
        kwargs = {
            'status': 'draft', 
            'organization': link.company.organization if link.company else link.contract.organization,
        }
        
        # Link to appropriate scope
        if link.contract:
            kwargs['contract'] = link.contract
            kwargs['company'] = link.contract.company
        elif link.company:
            kwargs['company'] = link.company
            
        serializer.save(**kwargs)

class PublicMeetingSerializer(MeetingSerializer):
    class Meta(MeetingSerializer.Meta):
        read_only_fields = MeetingSerializer.Meta.read_only_fields + ['company', 'contract']

class PublicMeetingViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = PublicMeetingSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    
    def get_queryset(self):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_meetings:
            return Meeting.objects.none()
            
        if link.contract:
            return Meeting.objects.filter(contract=link.contract)
        elif link.company:
            return Meeting.objects.filter(
                Q(company=link.company) | Q(contract__company=link.company)
            ).distinct()
        return Meeting.objects.none()

    def perform_create(self, serializer):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_meetings or not link.allow_meeting_creation:
            raise exceptions.PermissionDenied("Meeting creation not allowed")

        # Link to appropriate scope
        kwargs = {
            'organization': link.company.organization if link.company else link.contract.organization,
        }
        
        if link.contract:
            kwargs['contract'] = link.contract
            kwargs['company'] = link.contract.company
        elif link.company:
            kwargs['company'] = link.company
            
        serializer.save(**kwargs)

class PublicDocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = DocumentSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    
    def get_queryset(self):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_documents:
            return Document.objects.none()
            
        if link.contract:
            return Document.objects.filter(contract=link.contract)
        elif link.company:
            return Document.objects.filter(
                Q(company=link.company) | Q(contract__company=link.company)
            ).distinct()
        return Document.objects.none()

    def perform_create(self, serializer):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        if not link.allow_documents or not link.allow_document_upload:
            raise exceptions.PermissionDenied("Document upload not allowed")

        # Link to appropriate scope
        kwargs = {
            'organization': link.company.organization if link.company else link.contract.organization,
        }
        
        if link.contract:
            kwargs['contract'] = link.contract
            kwargs['company'] = link.contract.company
        elif link.company:
            kwargs['company'] = link.company
            
        serializer.save(**kwargs)

class PublicMeetingTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = MeetingTemplateSerializer
    
    def get_queryset(self):
        token = self.request.query_params.get('token')
        link = get_link_or_403(token)
        
        # Get organization from link
        org = link.company.organization if link.company else link.contract.organization
        return MeetingTemplate.objects.filter(organization=org)
