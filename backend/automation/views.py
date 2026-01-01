from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AutomationRule, AutomationLog
from .serializers import AutomationRuleSerializer, AutomationLogSerializer

class AutomationRuleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AutomationRuleSerializer

    def get_queryset(self):
        return AutomationRule.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class AutomationLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AutomationLogSerializer

    def get_queryset(self):
        # Filter logs where the rule belongs to the user's organization
        return AutomationLog.objects.filter(rule__organization=self.request.user.organization)
