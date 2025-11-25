import os
import json
from datetime import datetime
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from openai import OpenAI
from django.conf import settings
from .rag import RAGService
from .tools.crm import CRMTools
from .tools.tasks import TaskTools

class LLMService:
    def __init__(self):
        self.conf = settings.AI_CONF
        self.provider = self.conf.get('PROVIDER', 'openai')
        
        # Clean API Key
        raw_key = self.conf.get('API_KEY', '')
        if raw_key:
            self.api_key = raw_key.strip().strip("'").strip('"')
        else:
            self.api_key = None
            
        # Clean Base URL
        raw_url = self.conf.get('BASE_URL')
        if raw_url:
            self.base_url = raw_url.strip().strip("'").strip('"')
        else:
            self.base_url = None
            
        self.model = self.conf.get('MODEL', 'gpt-3.5-turbo')

    def run_agent(self, messages):
        """
        Main entry point. Decides whether to use a Tool or perform RAG Search.
        """
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        
        # 1. Intent Detection
        intent = self._detect_intent(last_user_msg)
        print(f"DEBUG: Detected Intent: {intent}")
        
        tool_name = intent.get('tool')
        params = intent.get('params', {})
        
        # 2. Execute Tool if applicable
        if tool_name and tool_name != 'SEARCH':
            return self._execute_tool(tool_name, params, last_user_msg)
            
        # 3. Fallback to RAG Search (Default)
        return self._run_rag_search(messages, last_user_msg)

    def _detect_intent(self, query):
        """
        Asks LLM to classify the query and extract parameters.
        """
        system_prompt = f"""
        You are an AI Orchestrator. Analyze the user's request and map it to one of the available tools.
        
        CURRENT DATE: {datetime.now().strftime('%Y-%m-%d')}
        
        AVAILABLE TOOLS:
        - CREATE_COMPANY: "Create company Acme", "Add new client Domos" (params: name, industry, size)
        - CREATE_CONTACT: "Add contact John Doe to Acme" (params: first_name, last_name, company_name, email, position)
        - CREATE_CONTRACT: "New contract for Acme", "Draft contract video promotion" (params: title, company_name, amount, status)
        - UPDATE_CONTRACT: "Mark contract X as signed" (params: title, status)
        - CREATE_TASK: "Remind me to call John tomorrow", "New task: Buy milk" (params: title, description, due_date)
        - EXTRACT_TASKS: "Extract tasks from these notes", "Make todos from this meeting" (params: text)
        - SEARCH: General questions, "Who is X?", "What did we say about Y?" (No params)
        
        IMPORTANT:
        - For dates (like "tomorrow", "next week", "in 3 days", or "25/12/2025"), calculate the exact date based on CURRENT DATE and return it in 'YYYY-MM-DD' format.
        
        OUTPUT FORMAT:
        Return ONLY a JSON object.
        Example: {{ "tool": "CREATE_COMPANY", "params": {{ "name": "Acme", "industry": "Tech" }} }}
        Example: {{ "tool": "SEARCH", "params": {{}} }}
        """
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': query}
        ]
        
        try:
            response = self.chat(messages, system_override="You are a JSON generator.")
            # Clean JSON
            if "```" in response:
                response = response.split("```")[1].replace("json", "").strip()
            return json.loads(response)
        except:
            return {"tool": "SEARCH"}

    def _execute_tool(self, tool_name, params, raw_text):
        """
        Executes the selected tool.
        """
        try:
            if tool_name == 'CREATE_COMPANY':
                return CRMTools.create_company(**params)
            elif tool_name == 'CREATE_CONTACT':
                return CRMTools.create_contact(**params)
            elif tool_name == 'CREATE_CONTRACT':
                return CRMTools.create_contract(**params)
            elif tool_name == 'UPDATE_CONTRACT':
                return CRMTools.update_contract_status(**params)
            elif tool_name == 'CREATE_TASK':
                return TaskTools.create_task(**params)
            elif tool_name == 'EXTRACT_TASKS':
                # For extraction, we might need the full text if the user said "from these notes: [TEXT]"
                # Or if they refer to previous context, but here we assume the text is in the prompt for now.
                # If the text is not in params, use the raw input.
                text_to_analyze = params.get('text') or raw_text
                return TaskTools.extract_and_create_tasks(text_to_analyze, self)
            else:
                return "Unknown tool."
        except Exception as e:
            return f"Error executing tool {tool_name}: {str(e)}"

    def _run_rag_search(self, messages, last_user_msg):
        """
        Performs the standard RAG workflow.
        """
        # 1. Extract Entities
        search_terms = self.extract_entities(last_user_msg)
        
        # 2. Retrieve Context
        context = RAGService.get_context(search_terms)
        
        # 3. Generate Answer
        return self.chat(messages, context)

    def chat(self, messages, context="", system_override=None):
        """
        Sends messages to the LLM and returns the response.
        """
        if system_override:
            system_prompt = system_override
        else:
            system_prompt = f"""You are an AI assistant for a Business Manager application. 
            You have access to the user's CRM, Tasks, and Pages data.
            
            CONTEXT FROM DATABASE:
            {context}
            
            INSTRUCTIONS:
            1. Answer the user's question based on the context provided above.
            2. AMBIGUITY CHECK: If the user's request is ambiguous because the context contains MULTIPLE relevant entities (e.g., multiple contracts, several meetings on the same topic, or different contacts with similar names), DO NOT guess.
               - List the available options found in the context.
               - Ask the user to clarify which specific item they are referring to.
            3. If the answer is not in the context, use your general knowledge but mention that you couldn't find specific records.
            4. Be concise and helpful.
            """

        # Prepend system prompt
        # If messages already has system, replace it? Or just prepend.
        # Usually frontend sends user/assistant history.
        full_messages = [{'role': 'system', 'content': system_prompt}] + messages

        if self.provider == 'gemini':
            return self._chat_gemini(full_messages)
        else:
            return self._chat_openai(full_messages)

    def _chat_openai(self, messages):
        client = OpenAI(
            api_key=self.api_key or 'dummy',
            base_url=self.base_url
        )
        
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error communicating with AI: {str(e)}"

    def _chat_gemini(self, messages):
        if not genai:
            return "Error: google-generativeai package is not installed."

        if not self.api_key:
            return "Error: Gemini API Key not configured."
            
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        system_msg = messages[0]['content']
        
        prompt = f"{system_msg}\n\nUser: {last_user_msg}"
        
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error communicating with Gemini: {str(e)}"

    def extract_entities(self, query):
        """
        Uses the LLM to extract search terms/entities from the user query.
        """
        system_prompt = """
        Extract the key entities (Company names, Person names, Contract titles, specific topics) from the user's query.
        Return ONLY a comma-separated list of the most important search terms.
        Example: "Meeting with Acme Corp about the roadrunner project" -> "Acme Corp, roadrunner project"
        If no specific entities are found, return the key nouns.
        """
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': query}
        ]
        
        try:
            # Use internal chat to avoid recursion/context injection
            if self.provider == 'gemini':
                response = self._chat_gemini(messages)
            else:
                response = self._chat_openai(messages)
                
            terms = [t.strip() for t in response.split(',') if t.strip()]
            return terms
        except:
            return query.split()
