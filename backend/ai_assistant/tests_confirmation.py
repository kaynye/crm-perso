from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from ai_assistant.tools.tasks import TaskTools

User = get_user_model()

class MockLLMService:
    def chat(self, messages, context="", system_override=""):
        return """[{"title": "Test Task"}]"""

class TaskConfirmationTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Confirm")
        self.user = User.objects.create_user(username='confirm', email='c@test.com', password='pw', organization=self.org)
        self.service = MockLLMService()

    def test_confirmation_button_value(self):
        query = "Extract tasks from meeting"
        result = TaskTools.extract_and_create_tasks(
            text="Context...", 
            llm_service=self.service, 
            user=self.user, 
            dry_run=True, 
            original_query=query
        )
        
        self.assertIsInstance(result, dict)
        choices = result['action']['choices']
        confirm_choice = next(c for c in choices if "Oui" in c['label'])
        
        # Check if value contains the specific instruction
        self.assertIn("Procéder à la création", confirm_choice['value'])
        self.assertIn(query, confirm_choice['value'])
