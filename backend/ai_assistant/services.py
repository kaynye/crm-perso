import os
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from openai import OpenAI
from django.conf import settings
from django.db.models import Q
from pages.models import Page
from crm.models import Company, Contact
from tasks.models import Task
from databases.models import Database

class RAGService:
    @staticmethod
    def get_context(query):
        """
        Retrieves relevant context from the database based on the query.
        Returns a formatted string.
        """
        context_parts = []
        
        # 1. Search Pages
        pages = Page.objects.filter(title__icontains=query)[:3]
        if pages.exists():
            context_parts.append("PAGES:")
            for page in pages:
                # Ideally we'd get some content too, but let's stick to metadata for now to save tokens
                context_parts.append(f"- {page.title} (ID: {page.id})")

        # 2. Search Companies
        companies = Company.objects.filter(name__icontains=query)[:3]
        if companies.exists():
            context_parts.append("\nCOMPANIES:")
            for company in companies:
                context_parts.append(f"- {company.name} (Industry: {company.industry}, Size: {company.size})")

        # 3. Search Contacts
        contacts = Contact.objects.filter(
            Q(first_name__icontains=query) | Q(last_name__icontains=query)
        )[:3]
        if contacts.exists():
            context_parts.append("\nCONTACTS:")
            for contact in contacts:
                context_parts.append(f"- {contact.first_name} {contact.last_name} (Company: {contact.company.name if contact.company else 'N/A'})")

        # 4. Search Tasks
        tasks = Task.objects.filter(title__icontains=query)[:5]
        if tasks.exists():
            context_parts.append("\nTASKS:")
            for task in tasks:
                assigned = task.assigned_to.username if task.assigned_to else "Unassigned"
                context_parts.append(f"- {task.title} (Status: {task.status}, Assigned: {assigned}, Due: {task.due_date})")

        if not context_parts:
            return "No specific database records found for this query."
            
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
        # Debug: Print runtime config
        print(f"--- LLM Service Debug ---")
        print(f"Provider: {self.provider}")
        print(f"Base URL: {self.base_url}")
        print(f"Model: {self.model}")
        masked = f"{self.api_key[:5]}...{self.api_key[-5:]}" if self.api_key and len(self.api_key) > 10 else "None/Short"
        print(f"API Key: {masked}")
        print(f"-------------------------")

        system_prompt = f"""You are an AI assistant for a Business Manager application. 
        You have access to the user's CRM, Tasks, and Pages data.
        
        CONTEXT FROM DATABASE:
        {context}
        
        Answer the user's question based on the context provided above. 
        If the answer is not in the context, use your general knowledge but mention that you couldn't find specific records.
        Be concise and helpful.
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
