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
from .tools.meetings import MeetingTools
from .tools.analytics import AnalyticsTools
from .tools.content import ContentTools
from .tools.email_tools import EmailTools

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

    def run_agent(self, messages, page_context=None, user=None):
        """
        Main entry point. Decides whether to use a Tool or perform RAG Search.
        """
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        
        # 1. Retrieve Context (RAG) - ALWAYS run this to give the agent knowledge
        search_terms = self.extract_entities(last_user_msg)
        rag_context = RAGService.get_context(search_terms)
        
        # 2. Intent Detection (with Context)
        intent = self._detect_intent(last_user_msg, page_context, rag_context)
        print(f"DEBUG: Detected Intent: {intent}")
        
        tool_name = intent.get('tool')
        params = intent.get('params', {})
        
        # 3. Execute Tool if applicable
        if tool_name and tool_name != 'SEARCH':
            result = self._execute_tool(tool_name, params, last_user_msg, user)
            # If result is a dict (structured action), return it
            if isinstance(result, dict):
                return result
            # If string, wrap it
            return {"content": str(result)}
            
        # 4. Fallback to Chat (using the already fetched context)
        return {"content": self.chat(messages, rag_context)}

    def _detect_intent(self, query, page_context=None, rag_context=""):
        """
        Asks LLM to classify the query and extract parameters.
        """
        context_str = ""
        if page_context and page_context.get('path'):
            path = page_context['path']
            # Simple parsing logic
            if '/crm/companies/' in path and path.split('/')[-1].isdigit() == False: # UUID check roughly
                # It's a company detail page
                # We could fetch the name here if we want to be super smart, but let's just give the ID
                # Actually, fetching the name is better.
                from crm.models import Company
                try:
                    cid = path.split('/')[-1]
                    c = Company.objects.get(id=cid)
                    context_str = f"USER IS VIEWING COMPANY: {c.name} (ID: {cid})"
                except:
                    pass
            elif '/crm/contracts/' in path:
                 from crm.models import Contract
                 try:
                     cid = path.split('/')[-1]
                     c = Contract.objects.get(id=cid)
                     context_str = f"USER IS VIEWING CONTRACT: {c.title} (ID: {cid})"
                 except:
                     pass

        from django.utils import timezone
        CURRENT_DATE = timezone.localtime().strftime('%Y-%m-%d %H:%M')
        
        system_prompt = f"""
        You are an AI Orchestrator. Analyze the user's request and map it to one of the available tools.
        
        PAGE CONTEXT:
        {context_str}
        
        DATABASE CONTEXT (RAG):
        {rag_context}
        
        CURRENT DATE: {CURRENT_DATE}
        
        AVAILABLE TOOLS:
        - CREATE_COMPANY: "Create company Acme", "Add new client Domos" (params: name, industry, size)
        - CREATE_CONTACT: "Add contact John Doe to Acme" (params: first_name, last_name, company_name, email, position)
        - CREATE_CONTACT: "Add contact John Doe to Acme to Acme" (params: first_name, last_name, company_name, email, position)
        - CREATE_CONTRACT: "New contract for Acme", "Draft contract video promotion" (params: title, company_name, amount, status)
        - UPDATE_CONTRACT: "Mark contract X as signed" (params: title, status)
        - CREATE_TASK: "Remind me to call John tomorrow", "New task: Buy milk" (params: title, description, due_date)
        - CREATE_MEETING: "Schedule call with Acme next Tuesday at 2pm", "Meeting with Bob on 2025-12-01 10:00" (params: title, company_name, date, type)
        - ADD_NOTE: "Add note 'Called him today'", "Note: Client is happy" (params: note_content, entity_type, entity_id)
        - ANALYZE_DATA: "Total contracts signed this month", "How many urgent tasks?" (params: entity_type, metric, time_period, filters)
        - DRAFT_CONTENT: "Draft email to TechNova about contract", "Write follow-up for meeting" (params: entity_type, entity_id, instruction)
        - SEND_EMAIL: "Send email to client@example.com", "Envoyer l'email" (params: to_email, subject, body)
        - EXTRACT_TASKS: "Extract tasks from these notes", "Make todos from this meeting" (params: text)
        - SEARCH: General questions, "Who is X?", "What did we say about Y?" (No params)
        
        IMPORTANT:
        - For ADD_NOTE / DRAFT_CONTENT: If user is viewing a specific entity (see context), use that entity's type and ID.
        - For ANALYZE_DATA: 
            - entity_type: 'company', 'contract', 'task', 'meeting'
            - metric: 'count', 'sum_amount' (contracts), 'urgent_tasks'
            - time_period: 'this_month', 'last_month', 'this_year', 'all_time'
            - filters: Use context if applicable (e.g. if viewing Company X, add {{'company': 'X'}}).
        - For dates (like "tomorrow", "next week", "in 3 days", or "25/12/2025"), calculate the exact date based on CURRENT DATE and return it in 'YYYY-MM-DD' format.
        - For MEETINGS, include the time if specified (format: 'YYYY-MM-DD HH:MM:SS'). If no time is given, assume 09:00:00.
        
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

    def _execute_tool(self, tool_name, params, raw_text, user=None):
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
            elif tool_name == 'CREATE_MEETING':
                return MeetingTools.create_meeting(user=user, **params)
            elif tool_name == 'ADD_NOTE':
                return CRMTools.add_note(**params)
            elif tool_name == 'ANALYZE_DATA':
                return AnalyticsTools.analyze_data(**params)
            elif tool_name == 'DRAFT_CONTENT':
                # Pass self (LLMService instance) to the tool
                return ContentTools.draft_content(llm_service=self, **params)
            elif tool_name == 'SEND_EMAIL':
                return EmailTools.send_email(**params)
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
            5. ALWAYS ANSWER IN FRENCH.
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
