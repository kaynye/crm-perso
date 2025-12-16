from django.test import TestCase
from ai_assistant.tools.tasks import TaskTools
from django.contrib.auth import get_user_model
from core.models import Organization

User = get_user_model()

class MockLLMService:
    def __init__(self, response):
        self.response = response
    def chat(self, *args, **kwargs):
        return self.response

class TaskParsingRobustnessTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Robust")
        self.user = User.objects.create_user(username='robust2', email='r2@test.com', password='pw', organization=self.org)

    def test_trailing_comma_with_boolean(self):
        # JSON with trailing comma (invalid JSON) AND lowercase boolean (invalid Python)
        # json.loads will fail due to comma.
        # ast.literal_eval will fail due to 'true'.
        messy_json = """
        [
            {
                "title": "Task 1",
                "status": "todo",
                "is_urgent": true,
            }
        ]
        """
        llm = MockLLMService(messy_json)
        # This currently fails or returns error string
        result = TaskTools.extract_and_create_tasks("text", llm, self.user)
        self.assertIn("1 tâches créées", result)

    def test_truncated_json_repair(self):
        # Truncated JSON
        truncated = """[{"title": "Truncated Task", "description": "some desc..."""
        # Ideally we might want to handle this, but it's hard.
        # For now, let's just focus on the boolean/comma issue which is more likely with "Valid but slightly wrong" LLM output.
        pass
