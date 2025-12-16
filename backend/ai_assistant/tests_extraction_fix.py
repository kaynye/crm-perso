from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from crm.models import Company
from tasks.models import Task
from ai_assistant.services import LLMService

User = get_user_model()

# Mock that simulates LLM response
class MockLLMService:
    def chat(self, messages, context="", system_override=""):
        # Emulate returning a JSON list of tasks with markdown and preamble
        return """
        Here are the tasks I found:
        ```json
        [
            {"title": "Follow up meeting", "due_date": "2025-01-15", "priority": "high"},
            {"title": "Send invoice", "due_date": "2025-01-20"}
        ]
        ```
        Hope this helps!
        """

class TaskExtractionTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Extract")
        self.user = User.objects.create_user(username='extractor', email='e@test.com', password='pw', organization=self.org)
        self.company = Company.objects.create(name="Expenséo", organization=self.org)
        
        self.mock_llm = MockLLMService()
        self.service = LLMService() # We only use its _detect_intent logic potentially, but here we test _execute_tool via service logic or tool directly.
        # Ideally we test _execute_tool logic in service. 
        # But let's test `extract_and_create_tasks` logic via tool.
        from ai_assistant.tools.tasks import TaskTools
        self.TaskTools = TaskTools

    def test_dry_run_extraction(self):
        # Case 1: Dry run (Question)
        # We manually call with dry_run=True because testing intent detection requires full LLM.
        # But we can verify the Tool's output format.
        
        result = self.TaskTools.extract_and_create_tasks(
            text="Meeting notes...", 
            llm_service=self.mock_llm, 
            user=self.user, 
            company_name="Expenséo", 
            dry_run=True
        )
        
        # Should return a DICT with action CHOICES
        self.assertIsInstance(result, dict)
        self.assertEqual(result['action']['type'], 'CHOICES')
        self.assertIn("Expenséo", result['content'])
        self.assertIn("Follow up meeting", result['content'])
        
        # Verify NO tasks created
        self.assertEqual(Task.objects.count(), 0)

    def test_create_extraction_linked(self):
        # Case 2: Creation (Confirm)
        result = self.TaskTools.extract_and_create_tasks(
            text="Meeting notes...", 
            llm_service=self.mock_llm, 
            user=self.user, 
            company_name="Expenséo", 
            dry_run=False
        )
        
        self.assertIn("2 tâches créées", result)
        self.assertEqual(Task.objects.count(), 2)
        
        # Check linking
        t1 = Task.objects.first()
        self.assertEqual(t1.company, self.company)
