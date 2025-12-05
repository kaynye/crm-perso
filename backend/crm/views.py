from rest_framework import viewsets, permissions
from core.permissions import HasGeminiSecret
from core.mixins import OrganizationScopeMixin

from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Company, Contact, Contract, Meeting, Document, MeetingTemplate
from .serializers import CompanySerializer, ContactSerializer, ContractSerializer, MeetingSerializer, DocumentSerializer, MeetingTemplateSerializer

class CompanyViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['name', 'industry']

class ContactViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'email']

class ContractViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'status']

class MeetingViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'contract', 'date']

    def perform_create(self, serializer):
        # OrganizationScopeMixin handles organization
        # We also want to set created_by
        if not self.request.user.organization:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("User does not belong to an organization.")
            
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )

class DocumentViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [HasGeminiSecret]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company', 'contract']

class MeetingTemplateViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = MeetingTemplate.objects.all()
    serializer_class = MeetingTemplateSerializer
    permission_classes = [HasGeminiSecret]
