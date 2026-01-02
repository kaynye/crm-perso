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
from .tools.email_tools import EmailTools
from .tools.vision import VisionTools
from .prompt_schemas import TOOLS_SCHEMA

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

    def run_agent(self, messages, page_context=None, user=None, stream=False):
        """
        Main entry point. Decides whether to use a Tool or perform RAG Search.
        """
        last_user_msg = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "")
        
        # 1. Retrieve Context (RAG)
        # Using full message for Hybrid Search is often better than just entities
        search_terms = last_user_msg 
        # search_terms = self.extract_entities(last_user_msg) # Old way
        rag_context, rag_sources = RAGService.get_context(search_terms, user=user)
        
        # 2. Intent Detection
        intent = self._detect_intent(last_user_msg, page_context, rag_context)
        print(f"DEBUG: Detected Intent: {intent}")
        
        tool_name = intent.get('tool')
        params = intent.get('params', {})
        
        # 3. Execute Tool if applicable (Tools are NOT streamed for now)
        if tool_name and tool_name != 'SEARCH':
            result = self._execute_tool(tool_name, params, last_user_msg, user, rag_context)
            
            # Special Handling for explicit RAG Search requested by the tool
            if isinstance(result, dict) and result.get('type') == 'RAG_SEARCH':
                 refined_query = result.get('query')
                 print(f"DEBUG: Performing Refined RAG Search with query: {refined_query}")
                 # Re-fetch context with the refined query
                 refined_rag_context, refined_sources = RAGService.get_context(refined_query, user=user)
                 # Proceed to Chat with this new context
                 chat_response = self.chat(messages, refined_rag_context, stream=stream)
                 
                 # attach sources to response if it's a generator (stream) or string?
                 # If stream, we can't easily attach. The caller (View) will handle 'sources' separately if we change return signature.
                 return {
                     "response": chat_response,
                     "sources": refined_sources
                 }

            if isinstance(result, dict):
                return result
            return {"content": str(result)}
            
        # 4. Fallback to Chat (Streamable)
        chat_response = self.chat(messages, rag_context, stream=stream)
        return {
            "response": chat_response,
            "sources": rag_sources
        }





    def _detect_intent(self, query, page_context=None, rag_context=""):
        """
        Uses OpenAI Native Function Calling to detect which tool to use.
        Returns a dict: {'tool': 'TOOL_NAME', 'params': {...}} or defaults to SEARCH.
        """
        context_str = ""
        if page_context and page_context.get('path'):
            path = page_context['path']
            # Simple parsing logic for context
            if '/crm/companies/' in path and path.split('/')[-1].isdigit() == False:
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
        
        # Inject Deep Page Context (Data from frontend)
        if page_context and page_context.get('data'):
             try:
                 data_str = json.dumps(page_context['data'], ensure_ascii=False, indent=2)
                 context_str += f"\n\n[DEEP PAGE CONTEXT - VISIBLE DATA]:\n{data_str}\n"
             except:
                 pass

        from django.utils import timezone
        CURRENT_DATE = timezone.localtime().strftime('%Y-%m-%d %H:%M')
        
        system_prompt = f"""
        You are an AI Orchestrator.
        
        PAGE CONTEXT:
        {context_str}
        
        DATABASE CONTEXT (RAG):
        {rag_context}
        
        CURRENT DATE: {CURRENT_DATE}
        
        INSTRUCTIONS:
        - Analyze the user request.
        - If a specific tool matches the request, CALL it.
        - If the user's request is general or ambiguous, or simply asking for information found in RAG, DO NOT call a tool. Just return a normal message (which means we default to SEARCH/Chat).
        - If information is missing for a tool (e.g. creating a meeting without a date), DO NOT guess. You can ask the user by just responding with text.
        """
        
        messages = [
            {'role': 'system', 'content': system_prompt},
            {'role': 'user', 'content': query}
        ]
        
        # If using OpenAI, we use the tools API
        if self.provider != 'gemini': 
            try:
                client = OpenAI(
                    api_key=self.api_key or 'dummy',
                    base_url=self.base_url
                )
                
                response = client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOLS_SCHEMA,
                    tool_choice="auto", # Let the model decide
                    temperature=0
                )
                
                msg = response.choices[0].message
                
                # Check if tool_calls matches
                if msg.tool_calls:
                    tool_call = msg.tool_calls[0]
                    # Map function name to our internal tool names
                    # Our schema names match exactly (CREATE_COMPANY etc)
                    return {
                        "tool": tool_call.function.name,
                        "params": json.loads(tool_call.function.arguments)
                    }
                else:
                    # No tool called -> Default to SEARCH (Chat)
                    return {"tool": "SEARCH"}
                    
            except Exception as e:
                print(f"Error in Intent Detection (Tools): {e}")
                return {"tool": "SEARCH"}
        else:
            # Fallback for Gemini or others who don't support this code path yet
            # (We could implement Gemini Function Calling later)
            print("Gemini does not support this specific Native Tool path yet. Falling back to Prompt Engineering.")
            # ... old logic or just return SEARCH for now
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
            elif tool_name == 'UPDATE_TASK':
                return TaskTools.update_task(user=user, **params)
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
            elif tool_name == 'SEARCH_KNOWLEDGE_BASE':
                # This tool explicitly requests RAG.
                # We return a special dictionary that signals to 'run_agent' to proceed with chat generation
                # using the specific query for context retrieval.
                return {
                    "type": "RAG_SEARCH",
                    "query": params.get('query', raw_text)
                }
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

    def chat(self, messages, context="", system_override=None, stream=False):
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
        full_messages = [{'role': 'system', 'content': system_prompt}] + messages

        if self.provider == 'gemini':
            return self._chat_gemini(full_messages, stream=stream)
        else:
            return self._chat_openai(full_messages, stream=stream)

    def _chat_openai(self, messages, stream=False):
        client = OpenAI(
            api_key=self.api_key or 'dummy',
            base_url=self.base_url
        )
        
        # Sanitize messages to prevent "Invalid request: message must not be empty" errors
        sanitized_messages = []
        for msg in messages:
            content = msg.get('content', '')
            if not content and msg.get('role') == 'assistant':
                 # If assistant message is empty (e.g. tool call result was just an action),
                 # we skip it or provide a placeholder to maintain context if possible.
                 # OpenAI refuses empty content for assistant unless tool_calls is set.
                 # Since we aren't maintaining full tool_calls history here, we substitute.
                 content = "[Action performed]"
            
            sanitized_messages.append({
                'role': msg['role'],
                'content': content
            })

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=sanitized_messages,
                stream=stream
            )
            
            if stream:
                def generate():
                    for chunk in response:
                        if chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                return generate()
            else:
                return response.choices[0].message.content
        except Exception as e:
            err = f"Error communicating with AI: {str(e)}"
            if stream:
                def generate_err():
                    yield err
                return generate_err()
            return err

    def _chat_gemini(self, messages, stream=False):
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
            response = model.generate_content(prompt, stream=stream)
            
            if stream:
                def generate():
                    for chunk in response:
                        yield chunk.text
                return generate()
            else:
                return response.text
        except Exception as e:
            err = f"Error communicating with Gemini: {str(e)}"
            if stream:
                def generate_err():
                    yield err
                return generate_err()
            return err

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
