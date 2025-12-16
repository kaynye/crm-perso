from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from tasks.models import Task
from ai_assistant.tools.tasks import TaskTools

User = get_user_model()

class MockLLMService:
    def __init__(self, response_text):
        self.response_text = response_text

    def chat(self, messages, context="", system_override=""):
        return self.response_text

class TaskExtractionFinalTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Final")
        self.user = User.objects.create_user(username='final', email='f@test.com', password='pw', organization=self.org)

    def test_json_parsing_success(self):
        # Case 1: Valid JSON response
        llm = MockLLMService("""
        [{"title": "Valid JSON Task", "due_date": "2025-01-01"}]
        """)
        result = TaskTools.extract_and_create_tasks("text", llm, self.user)
        self.assertIn("1 tâches créées", result)
        self.assertEqual(Task.objects.filter(title="Valid JSON Task").count(), 1)

    def test_single_quote_parsing_success(self):
        # Case 2: Python dict response (single quotes)
        llm = MockLLMService("""
        [{'title': 'Python Dict Task', 'due_date': '2025-01-02'}]
        """)
        result = TaskTools.extract_and_create_tasks("text", llm, self.user)
        self.assertIn("1 tâches créées", result)
        self.assertEqual(Task.objects.filter(title="Python Dict Task").count(), 1)

    def test_dry_run_return_dict(self):
        # Case 3: Dry Run -> Should return Dict (not None) whatever the format
        llm = MockLLMService("""[{"title": "Dry Task"}]""")
        result = TaskTools.extract_and_create_tasks("text", llm, self.user, dry_run=True)
        self.assertIsInstance(result, dict)
        self.assertEqual(result['action']['type'], 'CHOICES')
