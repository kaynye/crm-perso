from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    company_name = serializers.ReadOnlyField(source='company.name')
    contact_name = serializers.ReadOnlyField(source='contact.first_name')
    
    class Meta:
        model = Task
        fields = '__all__'
