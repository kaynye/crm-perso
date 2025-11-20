from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company, Contact
from .serializers import CompanySerializer, ContactSerializer

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
