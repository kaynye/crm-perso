import os
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from openai import OpenAI
from django.conf import settings
from django.db.models import Q
from pages.models import Page
from crm.models import Company, Contact, Contract, Meeting
from tasks.models import Task
from databases.models import Database
import json

class RAGService:
    @staticmethod
    def _parse_notes(notes_raw):
        """
        Parses Editor.js JSON and extracts plain text.
        """
        if not notes_raw: return ""
        try:
            data = json.loads(notes_raw)
            blocks = data.get('blocks', [])
            text_parts = []
            for block in blocks:
                text = block.get('data', {}).get('text', '')
                if text:
                    text_parts.append(text)
            return "\n".join(text_parts)
        except json.JSONDecodeError:
            return notes_raw

    @staticmethod
    def get_context(queries):
        """
        Retrieves relevant context from the database based on the queries.
        Accepts a list of search terms (strings).
        """
        if isinstance(queries, str):
            queries = [queries]
            
        context_parts = []
        seen_ids = set()

        for query in queries:
            # Skip very short queries to avoid noise
            if len(query) < 2: continue

            # 1. Search Companies
            companies = Company.objects.filter(name__icontains=query)[:2]
            for company in companies:
                if company.id in seen_ids: continue
                seen_ids.add(company.id)
                
                context_parts.append(f"COMPANY: {company.name} (Industry: {company.industry}, Size: {company.size})")
                
                # Fetch related active contracts
                contracts = company.contracts.exclude(status='finished')[:3]
                if contracts.exists():
                    context_parts.append(f"  > RELATED CONTRACTS:")
                    for c in contracts:
                        context_parts.append(f"    - {c.title} (Status: {c.status}, End: {c.end_date})")
                
                # Fetch recent meetings
                meetings = company.meetings.order_by('-date')[:3]
                if meetings.exists():
                    context_parts.append(f"  > RECENT MEETINGS:")
                    for m in meetings:
                        clean_notes = RAGService._parse_notes(m.notes)
                        # Truncate to 4000 chars of CLEAN text
                        notes_preview = clean_notes[:4000] + "..." if len(clean_notes) > 4000 else clean_notes
                        context_parts.append(f"    - {m.title} ({m.date}): {notes_preview}")

            # 2. Search Contracts
            from crm.models import Contract, Meeting
            contracts = Contract.objects.filter(title__icontains=query)[:3]
            for contract in contracts:
                if contract.id in seen_ids: continue
                seen_ids.add(contract.id)
                
                context_parts.append(f"CONTRACT: {contract.title} (Company: {contract.company.name}, Status: {contract.status})")
                context_parts.append(f"  > Details: Amount: {contract.amount}, Start: {contract.start_date}, End: {contract.end_date}")
                
                meetings = contract.meetings.order_by('-date')[:3]
                if meetings.exists():
                    context_parts.append(f"  > CONTRACT MEETINGS:")
                    for m in meetings:
                        clean_notes = RAGService._parse_notes(m.notes)
                        notes_preview = clean_notes[:4000] + "..." if len(clean_notes) > 4000 else clean_notes
                        context_parts.append(f"    - {m.title} ({m.date}): {notes_preview}")

            # 3. Search Meetings
            meetings = Meeting.objects.filter(
                Q(title__icontains=query) | Q(notes__icontains=query)
            )[:3]
            for m in meetings:
                if m.id in seen_ids: continue
                seen_ids.add(m.id)
                
                context_parts.append(f"MEETING: {m.title} (Date: {m.date})")
                context_parts.append(f"  > Company: {m.company.name}")
                if m.contract:
                    context_parts.append(f"  > Contract: {m.contract.title}")
                clean_notes = RAGService._parse_notes(m.notes)
                notes_preview = clean_notes[:4000] + "..." if len(clean_notes) > 4000 else clean_notes
                context_parts.append(f"  > Notes: {notes_preview}")

            # 4. Search Tasks
            tasks = Task.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query)
            )[:5]
            if tasks.exists():
                context_parts.append("\nTASKS:")
                for task in tasks:
                    if task.id in seen_ids: continue
                    seen_ids.add(task.id)
                    assigned = task.assigned_to.username if task.assigned_to else "Unassigned"
                    context_parts.append(f"- {task.title} (Status: {task.status}, Assigned: {assigned}, Due: {task.due_date})")
                    if task.description:
                        context_parts.append(f"  > Desc: {task.description[:100]}...")

            # 5. Search Pages
            pages = Page.objects.filter(title__icontains=query)[:3]
            if pages.exists():
                context_parts.append("\nPAGES:")
                for page in pages:
                    if page.id in seen_ids: continue
                    seen_ids.add(page.id)
                    context_parts.append(f"- {page.title} (ID: {page.id})")

        if not context_parts:
            return "No specific database records found for these queries."
            
        return "\n".join(context_parts)

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

    def chat(self, messages, context=""):
        """
        Sends messages to the LLM and returns the response.
        """
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
        full_messages = [{'role': 'system', 'content': system_prompt}] + messages

        if self.provider == 'gemini':
            return self._chat_gemini(full_messages)
        else:
            return self._chat_openai(full_messages)

    def _chat_openai(self, messages):
        client = OpenAI(
            api_key=self.api_key or 'dummy', # Ollama might not need a key
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
        
        # Convert OpenAI format to Gemini format
        # Gemini expects history + last message
        # Simplified for now: just concatenate or use the last prompt with context
        # Proper chat history conversion is complex, let's do a simple single-turn for now with context
        
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
        Returns a list of strings.
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
            if self.provider == 'gemini':
                response = self._chat_gemini(messages)
            else:
                response = self._chat_openai(messages)
                
            # Clean up response
            terms = [t.strip() for t in response.split(',') if t.strip()]
            return terms
        except:
            # Fallback to simple splitting if AI fails
            return query.split()
