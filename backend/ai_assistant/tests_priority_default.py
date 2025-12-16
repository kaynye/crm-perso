from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from tasks.models import Task
from ai_assistant.tools.tasks import TaskTools

User = get_user_model()

class MockLLMService:
    def chat(self, messages, context="", system_override=""):
        # Return task WITHOUT priority
        return """[{"title": "Task No Priority", "due_date": "2025-01-01"}]"""

class TaskPriorityDefaultTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Priority")
        self.user = User.objects.create_user(username='priority', email='p@test.com', password='pw', organization=self.org)
        self.service = MockLLMService()

    def test_default_priority_is_medium(self):
        TaskTools.extract_and_create_tasks("text", self.service, self.user)
        task = Task.objects.filter(title="Task No Priority").first()
        self.assertEqual(task.priority, 'medium', "Default priority should be 'medium'")
