from django.core.management.base import BaseCommand
from ai_assistant.signals import update_vector_index
from crm.models import Company, Contract, Meeting
from tasks.models import Task
from pages.models import Page
from ai_assistant.rag import RAGService

class Command(BaseCommand):
    help = 'Re-indexes all data for RAG with new metadata structure'

    def handle(self, *args, **options):
        self.stdout.write("Starting RAG Re-indexing...")

        # Companies
        companies = Company.objects.all()
        for c in companies:
            if not c.organization: continue
            text = f"Company: {c.name}\nIndustry: {c.industry}\nSize: {c.size}\nAddress: {c.address}\nNotes: {c.notes}"
            update_vector_index(c, "company", text, c.name, c.organization.id)
        self.stdout.write(f"Indexed {companies.count()} companies.")

        # Contracts
        contracts = Contract.objects.all()
        for c in contracts:
            if not c.organization: continue
            text = f"Contract: {c.title}\nCompany: {c.company.name if c.company else 'N/A'}\nStatus: {c.status}\nAmount: {c.amount}\nContent: {c.extracted_text or ''}"
            update_vector_index(c, "contract", text, c.title, c.organization.id)
        self.stdout.write(f"Indexed {contracts.count()} contracts.")

        # Meetings
        meetings = Meeting.objects.all()
        for m in meetings:
            if not m.organization: continue
            clean_notes = RAGService._parse_notes(m.notes)
            text = f"Meeting: {m.title}\nDate: {m.date}\nCompany: {m.company.name if m.company else 'N/A'}\nNotes: {clean_notes}"
            update_vector_index(m, "meeting", text, m.title, m.organization.id)
        self.stdout.write(f"Indexed {meetings.count()} meetings.")
        
        # Tasks
        tasks = Task.objects.all()
        for t in tasks:
            if not t.organization: continue
            assigned = t.assigned_to.username if t.assigned_to else 'Unassigned'
            text = f"Task: {t.title}\nStatus: {t.status}\nAssigned: {assigned}\nDescription: {t.description}"
            update_vector_index(t, "task", text, t.title, t.organization.id)
        self.stdout.write(f"Indexed {tasks.count()} tasks.")

        # Pages
        pages = Page.objects.all()
        for p in pages:
            if not p.organization: continue
            clean_content = RAGService._parse_notes(p.content)
            text = f"Page: {p.title}\nType: {p.page_type}\nContent: {clean_content}"
            update_vector_index(p, "page", text, p.title, p.organization.id)
        self.stdout.write(f"Indexed {pages.count()} pages.")

        self.stdout.write(self.style.SUCCESS('Successfully re-indexed all data.'))
