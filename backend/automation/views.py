from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AutomationRule
from .serializers import AutomationRuleSerializer

class AutomationRuleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AutomationRuleSerializer

    def get_queryset(self):
        return AutomationRule.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
