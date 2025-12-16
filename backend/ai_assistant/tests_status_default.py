from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from tasks.models import Task
from ai_assistant.tools.tasks import TaskTools

User = get_user_model()

class MockLLMService:
    def chat(self, messages, context="", system_override=""):
        # Return task WITHOUT status
        return """[{"title": "Task No Status", "due_date": "2025-01-01"}]"""

class TaskStatusDefaultTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Status")
        self.user = User.objects.create_user(username='status', email='s@test.com', password='pw', organization=self.org)
        self.service = MockLLMService()

    def test_default_status_is_todo(self):
        TaskTools.extract_and_create_tasks("text", self.service, self.user)
        task = Task.objects.filter(title="Task No Status").first()
        self.assertEqual(task.status, 'todo', "Default status should be 'todo'")
