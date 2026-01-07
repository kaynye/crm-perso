import os
import django
import sys
from unittest.mock import MagicMock, patch

# Setup Django
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from ai_assistant.services import LLMService

def test_self_healing():
    print("--- Testing Self-Healing Agents ---")
    service = LLMService()
    
    # Mock messages
    messages = [{'role': 'user', 'content': 'Create a task for cleaning'}]
    
    # Mock _detect_intent to return a tool call
    # First call: Returns tool
    # Second call: Returns tool again (retry)
    # Third call: Returns SEARCH (success/give up)
    
    # Actually, simpler: We want to see _execute_tool called TWICE.
    
    with patch.object(service, '_detect_intent') as mock_detect:
        with patch.object(service, '_execute_tool') as mock_execute:
            with patch.object(service, 'chat') as mock_chat:
                
                # Setup Mocks
                mock_detect.return_value = {'tool': 'CREATE_TASK', 'params': {'title': 'Cleaning'}}
                mock_chat.return_value = "Chat Fallback"
                
                # First execution fails, Second succeeds
                mock_execute.side_effect = [
                    "Error: Missing Due Date", # Turn 1: Fails
                    "Task Created Successfully" # Turn 2: Succeeds
                ]
                
                # Run
                result = service.run_agent(messages)
                
                # Assertions
                print(f"Result: {result}")
                
                call_count = mock_execute.call_count
                print(f"Execute Tool Call Count: {call_count}")
                
                if call_count == 2:
                    print("SUCCESS: Agent retried after error!")
                    with open('verify_healing_result.txt', 'w') as f:
                        f.write("SUCCESS: Agent retried after error! (Call count: 2)")
                elif call_count == 1:
                    print("FAILURE: Agent gave up after one error.")
                    with open('verify_healing_result.txt', 'w') as f:
                        f.write("FAILURE: Agent gave up after one error.")
                else:
                    print(f"FAILURE: Unexpected call count {call_count}")
                    with open('verify_healing_result.txt', 'w') as f:
                        f.write(f"FAILURE: Unexpected call count {call_count}")

if __name__ == "__main__":
    test_self_healing()
