from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        # Group tasks by status
        tasks = Task.objects.all()
        kanban_data = {
            'todo': TaskSerializer(tasks.filter(status='todo'), many=True).data,
            'in_progress': TaskSerializer(tasks.filter(status='in_progress'), many=True).data,
            'done': TaskSerializer(tasks.filter(status='done'), many=True).data,
        }
        return Response(kanban_data)
