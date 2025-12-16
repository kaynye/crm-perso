from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from tasks.models import Task
from ai_assistant.tools.tasks import TaskTools

User = get_user_model()

# Mock that simulates LLM response with SINGLE QUOTES
class MockLLMService:
    def chat(self, messages, context="", system_override=""):
        return """
        [{'title': 'Task matching single quotes', 'due_date': '2025-01-01'}]
        """

class TaskExtractionRobustnessTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Robust")
        self.user = User.objects.create_user(username='robust', email='r@test.com', password='pw', organization=self.org)
        self.service = MockLLMService()

    def test_single_quote_parsing(self):
        result = TaskTools.extract_and_create_tasks(
            text="notes", 
            llm_service=self.service, 
            user=self.user
        )
        self.assertIn("Génération réussie", result)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.first().title, "Task matching single quotes")
