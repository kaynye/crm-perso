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
from .tools.vision import VisionTools

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
        rag_context = RAGService.get_context(search_terms, user=user)
        # rag_context = "" # RAG Disabled for now as per user request
        
        # 2. Intent Detection (with Context)
        intent = self._detect_intent(last_user_msg, page_context, rag_context)
        print(f"DEBUG: Detected Intent: {intent}")
        
        tool_name = intent.get('tool')
        params = intent.get('params', {})
        
        # 3. Execute Tool if applicable
        if tool_name and tool_name != 'SEARCH':
            result = self._execute_tool(tool_name, params, last_user_msg, user, rag_context)
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
        - CREATE_COMPANY: "Create company Acme" (params: name, industry, size)
        - UPDATE_COMPANY: "Update Acme industry to Tech", "Set size of Acme to Large", "Add note to Acme" (params: name, industry, size, website, notes)
        - GET_COMPANY_DETAILS: "Tell me about Acme", "Details for TechCorp" (params: name)
        
        - CREATE_CONTACT: "Add contact John Doe to Acme" (params: first_name, last_name, company_name, email, position)
        - UPDATE_CONTACT: "Update John Doe email", "Change position of Jane to CTO" (params: name, email, position, phone)
        
        - CREATE_CONTRACT: "New contract for Acme" (params: title, company_name, amount, status)
        - UPDATE_CONTRACT: "Mark contract X as signed" (params: title, status)
        
        - CREATE_TASK: "Remind me to call John" (params: title, description, due_date)
        - EXTRACT_TASKS: "Extract tasks from these notes" (params: text, company_name)
        - LIST_TASKS: "My tasks" (params: status, priority, due_date_range)
        
        - CREATE_MEETING: "Schedule call with Acme" (params: title, company_name, date, type)
        - LIST_MEETINGS: "Meetings with Acme", "Upcoming meetings" (params: company_name, date_range)
        
        - ADD_NOTE: "Add note to Acme" (params: note_content, entity_type, entity_id)
        - ANALYZE_DATA: "How many contracts?", "Top clients by revenue", "Most active clients" (params: entity_type, metric, time_period, filters)
        - DRAFT_CONTENT: "Draft email" (params: entity_type, entity_id, instruction)
        - SEND_EMAIL: "Send email" (params: to_email, subject, body)
        - ANALYZE_IMAGE: "Analyze this image", "Read this invoice", "What is in this picture?" (params: file_id)
        
        - SEARCH: General questions (No params)
        - ASK_USER: Use this if a REQUIRED parameter is missing for a tool. (params: question)
        
        REQUIRED PARAMETERS:
        - CREATE_COMPANY: name
        - CREATE_CONTACT: first_name, last_name
        - CREATE_CONTRACT: title, company_name
        - CREATE_MEETING: title, company_name, date
        - CREATE_TASK: title
        
        INSTRUCTIONS:
        1. If the user's request matches a tool but is missing a REQUIRED parameter (listed above), use 'ASK_USER'.
           Example: "Create meeting with Acme" -> {{ "tool": "ASK_USER", "params": {{ "question": "Quelle est la date et l'heure de la réunion ?" }} }}
        2. SMART WORKFLOWS (Multi-step):
           - "Onboard new client" / "Nouveau client":
             Step 1: Ask for Company Name -> CREATE_COMPANY
             Step 2: Ask for Industry/Size -> UPDATE_COMPANY
             Step 3: Ask for Main Contact Name/Email -> CREATE_CONTACT
             Step 4: Ask for Kickoff Meeting Date -> CREATE_MEETING
             (Guide the user through these steps one by one using ASK_USER if information is missing).
        3. For ANALYZE_DATA:
           - "Top clients by revenue" -> metric='top_clients_revenue', entity_type='contract'
           - "Most active clients" -> metric='top_clients_activity', entity_type='meeting'
        4. Verify if the missing parameter is in the PAGE CONTEXT or DATABASE CONTEXT. If yes, use it.
        5. If all parameters are present, use the specific tool.
        
        OUTPUT FORMAT:
        Return ONLY a JSON object.
        Example: {{ "tool": "CREATE_COMPANY", "params": {{ "name": "Acme" }} }}
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

    def _execute_tool(self, tool_name, params, raw_text, user=None, rag_context=""):
        """
        Executes the selected tool.
        """
        try:
            if tool_name == 'CREATE_COMPANY':
                return CRMTools.create_company(user=user, **params)
            elif tool_name == 'UPDATE_COMPANY':
                return CRMTools.update_company(user=user, **params)
            elif tool_name == 'GET_COMPANY_DETAILS':
                return CRMTools.get_company_details(user=user, **params)
            elif tool_name == 'CREATE_CONTACT':
                return CRMTools.create_contact(user=user, **params)
            elif tool_name == 'UPDATE_CONTACT':
                return CRMTools.update_contact(user=user, **params)
            elif tool_name == 'CREATE_CONTRACT':
                return CRMTools.create_contract(user=user, **params)
            elif tool_name == 'UPDATE_CONTRACT':
                return CRMTools.update_contract_status(**params)
            elif tool_name == 'CREATE_TASK':
                return TaskTools.create_task(user=user, **params)
            elif tool_name == 'CREATE_MEETING':
                return MeetingTools.create_meeting(user=user, **params)
            elif tool_name == 'LIST_MEETINGS':
                return MeetingTools.list_meetings(user=user, **params)
            elif tool_name == 'ADD_NOTE':
                return CRMTools.add_note(user=user, **params)
            elif tool_name == 'ANALYZE_DATA':
                return AnalyticsTools.analyze_data(user=user, **params)
            elif tool_name == 'DRAFT_CONTENT':
                # Pass self (LLMService instance) to the tool
                return ContentTools.draft_content(llm_service=self, user=user, rag_context=rag_context, **params)
            elif tool_name == 'SEND_EMAIL':
                return EmailTools.send_email(user=user, **params)
            elif tool_name == 'EXTRACT_TASKS':
                # For extraction, we might need the full text if the user said "from these notes: [TEXT]"
                # Or if they refer to previous context.
                # We append RAG context to the analyzed text so the LLM has source material.
                text_to_analyze = params.get('text') or raw_text
                if rag_context:
                    text_to_analyze += f"\n\nCONTEXTE ADDITIONNEL (RAG):\n{rag_context}"
                
                company_name = params.get('company_name')
                company_name = params.get('company_name')
                
                # Check for dry_run intent (keywords like "Suggest", "What scan", "Proposed")
                # Or simply default to True if not explicitly "Create"
                # For now, let's look for params or context.
                # Actually, let's rely on params.
                dry_run = params.get('dry_run', False) 
                
                # If user asks "What tasks..." -> dry_run=True should be set by LLM ideally.
                # But to start, we can infer:
                if "tache" in raw_text.lower() and ("quoi" in raw_text.lower() or "quelle" in raw_text.lower() or "peux" in raw_text.lower()):
                    dry_run = True
                
                # OVERRIDE: If explicit confirmation/creation matches (e.g. button click)
                if "confirmation" in raw_text.lower() or "création" in raw_text.lower() or "create" in raw_text.lower() or "procéder" in raw_text.lower():
                    dry_run = False
                    
                return TaskTools.extract_and_create_tasks(text_to_analyze, self, user=user, company_name=company_name, dry_run=dry_run, original_query=raw_text)
            elif tool_name == 'LIST_TASKS':
                return TaskTools.list_tasks(user=user, **params)
            elif tool_name == 'ASK_USER':
                # Return the question directly to the chat
                return params.get('question', "Je n'ai pas compris, pouvez-vous préciser ?")
            elif tool_name == 'ANALYZE_IMAGE':
                file_id = params.get('file_id')
                # If file_id is not provided by the intent (maybe implicit?), 
                # we should check if there's a recent file upload in the context (passed from frontend).
                # But here lets assume params has it or we can pass it from context.
                if not file_id:
                     # Fallback if the user just uploaded something and said "analyze this"
                     # The frontend should pass the last uploaded file_id in the message context theoretically.
                     # For now, let's assume valid ID.
                     return "Erreur: Aucun fichier spécifié."
                
                # Construct full path
                full_path = os.path.join(settings.MEDIA_ROOT, file_id)
                prompt = raw_text # Use user's full question as prompt
                return VisionTools.analyze_image(full_path, prompt, user=user)
            else:
                return "Unknown tool."
        except Exception as e:
            return f"Error executing tool {tool_name}: {str(e)}"

    def _run_rag_search(self, messages, last_user_msg, user=None):
        """
        Performs the standard RAG workflow.
        """
        # 1. Extract Entities
        search_terms = self.extract_entities(last_user_msg)
        
        # 2. Retrieve Context
        context = RAGService.get_context(search_terms, user=user)
        # context = "" # RAG Disabled
        
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

    def summarize_text(self, text):
        """
        Summarizes the given text using the LLM.
        """
        system_prompt = """
        You are an expert summarizer. 
        Summarize the following text in a concise and professional manner.
        Highlight key points, decisions made, and action items if any.
        The summary should be in French.
        """
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': text}
        ]
        
        try:
            if self.provider == 'gemini':
                return self._chat_gemini(messages)
            else:
                return self._chat_openai(messages)
        except Exception as e:
            return f"Error generating summary: {str(e)}"
