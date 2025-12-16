from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from ai_assistant.services import LLMService
# We need to mock the tool execution or inspect how it's called.
# Since we modified the service logic that calls the tool, we should call _execute_tool directly or run_agent.

User = get_user_model()

class MockTool:
    @staticmethod
    def extract_and_create_tasks(text, llm_service, user=None, company_name=None, dry_run=False, original_query=None):
        return {"dry_run": dry_run}

class LoopFixTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Loop")
        self.user = User.objects.create_user(username='loop', email='l@test.com', password='pw', organization=self.org)
        self.service = LLMService()

    def test_confirmation_overrides_dry_run(self):
        # Determine intent manually to mock what happens before _execute_tool
        # But we want to test the LOGIC inside _execute_tool that sets dry_run.
        
        # We'll monkeypatch TaskTools.extract_and_create_tasks to return the dry_run value it received
        from ai_assistant.tools.tasks import TaskTools
        original_method = TaskTools.extract_and_create_tasks
        TaskTools.extract_and_create_tasks = MockTool.extract_and_create_tasks
        
        try:
            # Simulate the button click message
            # It contains both the question (which triggers True) and Confirmation (which should override to False)
            raw_text = "Procéder à la création des tâches (Confirmation) : d'aprés ma derniere reunion avec expenséo, quelle tache je peux en tiré"
            
            # Param 'dry_run' might come as False from intent detection if the LLM is smart, 
            # OR as True if it blindly follows the question.
            # But usually params is empty for EXTRACT_TASKS unless extracted.
            # Let's assume params={}
            
            result = self.service._execute_tool(
                tool_name='EXTRACT_TASKS',
                params={}, 
                raw_text=raw_text, 
                user=self.user
            )
            
            self.assertFalse(result['dry_run'], "dry_run should be False due to override")
            
        finally:
            TaskTools.extract_and_create_tasks = original_method
