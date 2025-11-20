from rest_framework import serializers
from .models import Company, Contact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class CompanySerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'
