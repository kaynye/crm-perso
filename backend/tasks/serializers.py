from rest_framework import serializers
from .models import Task
from core.validators import validate_cross_organization_reference

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    space_name = serializers.SerializerMethodField()

    def get_space_name(self, obj):
        if obj.space:
            return obj.space.name
        return None

    linked_space_id = serializers.SerializerMethodField()

    def get_linked_space_id(self, obj):
        if obj.space:
            return obj.space.id
        return None
    contact_name = serializers.ReadOnlyField(source='contact.first_name')
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['organization']

    def validate(self, data):
        # Skip this validation for public access (anonymous users)
        # Security is handled by the PublicTaskViewSet permissions and scope logic
        user = self.context['request'].user
        if user.is_authenticated:
            validate_cross_organization_reference(
                user,
                space=data.get('space'),
                contract=data.get('contract'),
                contact=data.get('contact'),
                page=data.get('page')
            )
        return data
