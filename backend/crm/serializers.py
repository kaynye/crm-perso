from rest_framework import serializers
from .models import Company, Contact, Contract, Meeting, Document, MeetingTemplate, SharedLink
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

class SharedLinkSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = SharedLink
        fields = ['id', 'token', 'contract', 'company', 'allow_tasks', 'allow_task_creation', 'allow_meetings', 'allow_meeting_creation', 'allow_documents', 'allow_document_upload', 'created_at', 'expires_at', 'views_count', 'url', 'password']
        read_only_fields = ['token', 'views_count', 'created_by']

    def create(self, validated_data):
        from django.contrib.auth.hashers import make_password
        if 'password' in validated_data and validated_data['password']:
            validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

    def get_url(self, obj):
        # Return relative path for frontend
        return f"/shared/{obj.token}"
    
    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            company=data.get('company'),
            contract=data.get('contract')
        )
        return data
