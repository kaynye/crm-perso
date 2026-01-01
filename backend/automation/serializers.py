from rest_framework import serializers
from .models import AutomationRule, AutomationLog

class AutomationRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AutomationRule
        fields = '__all__'
        read_only_fields = ('organization',)

class AutomationLogSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    
    class Meta:
        model = AutomationLog
        fields = ['id', 'rule', 'rule_name', 'target_model', 'target_id', 'status', 'details', 'created_at']
