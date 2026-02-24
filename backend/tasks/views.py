from rest_framework import viewsets, permissions
from core.permissions import HasGeminiSecret, SpaceRolePermission
from core.mixins import OrganizationScopeMixin

from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
from crm.models import ActivityLog

class TaskViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]

    def perform_create(self, serializer):
        task = serializer.save()
        if hasattr(task, 'space') and task.space:
            ActivityLog.objects.create(
                space=task.space,
                actor=self.request.user,
                action='created',
                entity_type='Tâche',
                entity_name=task.title
            )

    def perform_update(self, serializer):
        # Retrieve the original instance before saving
        old_task = self.get_object()
        old_status = old_task.status
        old_assignee = old_task.assigned_to
        
        task = serializer.save()
        
        details = {}
        if old_status != task.status:
            details['status'] = {
                'old': old_status,
                'new': task.status
            }
        
        if old_assignee != task.assigned_to:
            details['assignee'] = {
                'old': getattr(old_assignee, 'first_name', '') + " " + getattr(old_assignee, 'last_name', '') if old_assignee else None,
                'new': getattr(task.assigned_to, 'first_name', '') + " " + getattr(task.assigned_to, 'last_name', '') if task.assigned_to else None,
            }

        if hasattr(task, 'space') and task.space:
            ActivityLog.objects.create(
                space=task.space,
                actor=self.request.user,
                action='updated',
                entity_type='Tâche',
                entity_name=task.title,
                details=details
            )

    def perform_destroy(self, instance):
        if hasattr(instance, 'space') and instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=self.request.user,
                action='deleted',
                entity_type='Tâche',
                entity_name=instance.title
            )
        super().perform_destroy(instance)

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        # Group tasks by status
        tasks = self.get_queryset()
        
        # Apply filters
        contract_id = request.query_params.get('contract')
        if contract_id:
            tasks = tasks.filter(contract_id=contract_id)
            
        space_id = request.query_params.get('space')
        if space_id:
            tasks = tasks.filter(space_id=space_id)

        kanban_data = {
            'draft': TaskSerializer(tasks.filter(status='draft'), many=True).data,
            'todo': TaskSerializer(tasks.filter(status='todo'), many=True).data,
            'in_progress': TaskSerializer(tasks.filter(status='in_progress'), many=True).data,
            'done': TaskSerializer(tasks.filter(status='done'), many=True).data,
        }
        return Response(kanban_data)
