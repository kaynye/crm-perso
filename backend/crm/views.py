from rest_framework import viewsets, permissions
from core.permissions import HasGeminiSecret


from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Company, Contact, Contract, Meeting, Document, MeetingTemplate
from .serializers import CompanySerializer, ContactSerializer, ContractSerializer, MeetingSerializer, DocumentSerializer, MeetingTemplateSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['name', 'industry']

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'email']

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'status']

class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [HasGeminiSecret]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['company', 'contract', 'date']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [HasGeminiSecret]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['company', 'contract']

class MeetingTemplateViewSet(viewsets.ModelViewSet):
    queryset = MeetingTemplate.objects.all()
    serializer_class = MeetingTemplateSerializer
    permission_classes = [HasGeminiSecret]
