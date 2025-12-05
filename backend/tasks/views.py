from rest_framework import viewsets, permissions
from core.permissions import HasGeminiSecret
from core.mixins import OrganizationScopeMixin

from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [HasGeminiSecret]

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        # Group tasks by status
        tasks = self.get_queryset()
        
        # Apply filters
        contract_id = request.query_params.get('contract')
        if contract_id:
            tasks = tasks.filter(contract_id=contract_id)
            
        company_id = request.query_params.get('company')
        if company_id:
            tasks = tasks.filter(company_id=company_id)

        kanban_data = {
            'todo': TaskSerializer(tasks.filter(status='todo'), many=True).data,
            'in_progress': TaskSerializer(tasks.filter(status='in_progress'), many=True).data,
            'done': TaskSerializer(tasks.filter(status='done'), many=True).data,
        }
        return Response(kanban_data)
