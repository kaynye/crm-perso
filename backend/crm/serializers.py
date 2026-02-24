from rest_framework import serializers
from .models import Space, Contact, Contract, Meeting, Document, MeetingTemplate, SharedLink, ContractTemplate, SpaceType, SpaceMember, ActivityLog
from core.validators import validate_cross_organization_reference

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            space=data.get('space')
        )
        return data

class ContractSerializer(serializers.ModelSerializer):
    space_name = serializers.ReadOnlyField(source='space.name')
    organization_details = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ['organization']

    def get_organization_details(self, obj):
        return {
            'name': obj.organization.name,
            'legal_name': obj.organization.legal_name,
            'logo': obj.organization.logo.url if obj.organization.logo else None,
            'siret': obj.organization.siret,
            'vat_number': obj.organization.vat_number,
            'address_billing': obj.organization.address_billing,
        }
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            space=data.get('space')
        )
        return data

class ContractTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractTemplate
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            space=data.get('space')
        )
        return data

class SpaceTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceType
        fields = '__all__'
        read_only_fields = ['organization']

class SpaceMemberSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField()
    
    class Meta:
        model = SpaceMember
        fields = '__all__'
        
    def get_user_details(self, obj):
        return {
            'id': obj.user.id,
            'first_name': obj.user.first_name,
            'last_name': obj.user.last_name,
            'email': obj.user.email,
        }

class MeetingSerializer(serializers.ModelSerializer):
    space_name = serializers.ReadOnlyField(source='space.name')
    
    class Meta:
        model = Meeting
        fields = '__all__'
        read_only_fields = ['organization', 'created_by']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            space=data.get('space'),
            contract=data.get('contract')
        )
        return data

class SpaceSerializer(serializers.ModelSerializer):
    contacts = ContactSerializer(many=True, read_only=True)
    contracts = ContractSerializer(many=True, read_only=True)
    meetings = MeetingSerializer(many=True, read_only=True)
    type_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Space
        fields = '__all__'
        read_only_fields = ['organization']

    def get_type_details(self, obj):
        if obj.type:
            return {
                'id': obj.type.id,
                'name': obj.type.name,
                'has_contracts': obj.type.has_contracts,
                'has_meetings': obj.type.has_meetings,
                'has_documents': obj.type.has_documents,
                'has_tasks': obj.type.has_tasks,
                'has_contacts': obj.type.has_contacts,
                'vocabulary': obj.type.vocabulary,
            }
        return None

class DocumentSerializer(serializers.ModelSerializer):
    space_name = serializers.ReadOnlyField(source='space.name')
    contract_title = serializers.ReadOnlyField(source='contract.title')

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        validate_cross_organization_reference(
            self.context['request'].user,
            space=data.get('space'),
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
        fields = ['id', 'token', 'contract', 'space', 'allow_tasks', 'allow_task_creation', 'allow_meetings', 'allow_meeting_creation', 'allow_documents', 'allow_document_upload', 'created_at', 'expires_at', 'views_count', 'url', 'password']
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
            space=data.get('space'),
            contract=data.get('contract')
        )
        return data

class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = '__all__'
        read_only_fields = ['space', 'actor', 'action', 'entity_type', 'entity_name', 'timestamp']

    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.email
        return "System"
