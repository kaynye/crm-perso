from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    company_name = serializers.SerializerMethodField()

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        if obj.contract and obj.contract.company:
            return obj.contract.company.name
        return None

    linked_company_id = serializers.SerializerMethodField()

    def get_linked_company_id(self, obj):
        if obj.company:
            return obj.company.id
        if obj.contract and obj.contract.company:
            return obj.contract.company.id
        return None
    contact_name = serializers.ReadOnlyField(source='contact.first_name')
    
    class Meta:
        model = Task
        fields = '__all__'
