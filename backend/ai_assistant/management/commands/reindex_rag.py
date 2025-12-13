from django.core.management.base import BaseCommand
from ai_assistant.vector_store import VectorStore
from ai_assistant.rag import RAGService
from crm.models import Company, Contact, Contract, Meeting
from tasks.models import Task
from pages.models import Page

class Command(BaseCommand):
    help = 'Reindexes all data into the Vector Store (ChromaDB)'

    def handle(self, *args, **options):
        self.stdout.write("Starting RAG Reindexing...")
        
        texts = []
        metadatas = []
        ids = []

        # 1. Index Companies
        companies = Company.objects.all()
        for c in companies:
            text = f"Company: {c.name}\nIndustry: {c.industry}\nSize: {c.size}\nAddress: {c.address}\nNotes: {c.notes}"
            texts.append(text)
            metadatas.append({"type": "company", "title": c.name, "id": str(c.id)})
            ids.append(f"company_{c.id}")
        self.stdout.write(f"Indexed {len(companies)} companies.")

        # 2. Index Contracts
        contracts = Contract.objects.all()
        for c in contracts:
            text = f"Contract: {c.title}\nCompany: {c.company.name if c.company else 'N/A'}\nStatus: {c.status}\nAmount: {c.amount}\nContent: {c.extracted_text or ''}"
            texts.append(text)
            metadatas.append({"type": "contract", "title": c.title, "id": str(c.id)})
            ids.append(f"contract_{c.id}")
        self.stdout.write(f"Indexed {len(contracts)} contracts.")

        # 3. Index Meetings
        meetings = Meeting.objects.all()
        for m in meetings:
            clean_notes = RAGService._parse_notes(m.notes)
            text = f"Meeting: {m.title}\nDate: {m.date}\nCompany: {m.company.name if m.company else 'N/A'}\nNotes: {clean_notes}"
            texts.append(text)
            metadatas.append({"type": "meeting", "title": m.title, "id": str(m.id)})
            ids.append(f"meeting_{m.id}")
        self.stdout.write(f"Indexed {len(meetings)} meetings.")

        # 4. Index Tasks
        tasks = Task.objects.all()
        for t in tasks:
            text = f"Task: {t.title}\nStatus: {t.status}\nAssigned: {t.assigned_to.username if t.assigned_to else 'Unassigned'}\nDescription: {t.description}"
            texts.append(text)
            metadatas.append({"type": "task", "title": t.title, "id": str(t.id)})
            ids.append(f"task_{t.id}")
        self.stdout.write(f"Indexed {len(tasks)} tasks.")

        # 5. Index Pages
        pages = Page.objects.all()
        for p in pages:
            clean_content = RAGService._parse_notes(p.content)
            text = f"Page: {p.title}\nType: {p.page_type}\nContent: {clean_content}"
            texts.append(text)
            metadatas.append({"type": "page", "title": p.title, "id": str(p.id)})
            ids.append(f"page_{p.id}")
        self.stdout.write(f"Indexed {len(pages)} pages.")

        if texts:
            VectorStore.add_texts(texts, metadatas, ids)
            self.stdout.write(self.style.SUCCESS(f"Successfully indexed {len(texts)} documents into ChromaDB."))
        else:
            self.stdout.write(self.style.WARNING("No data found to index."))
