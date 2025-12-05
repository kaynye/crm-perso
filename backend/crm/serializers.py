from rest_framework import serializers
from .models import Company, Contact, Contract, Meeting, Document, MeetingTemplate
from core.validators import validate_cross_organization_reference

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            company=data.get('company')
        )
        return data

class ContractSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            company=data.get('company')
        )
        return data

class MeetingSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ['organization', 'created_by']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            company=data.get('company'),
            contract=data.get('contract')
        )
        return data

class CompanySerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contracts = ContractSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['organization']

class DocumentSerializer(serializers.ModelSerializer):
    company_name = serializers.ReadOnlyField(source='company.name')
    contract_title = serializers.ReadOnlyField(source='contract.title')

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            company=data.get('company'),
            contract=data.get('contract')
        )
        return data

class MeetingTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingTemplate
        fields = '__all__'
        read_only_fields = ['organization']
