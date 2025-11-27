import json
from django.db.models import Q
from pages.models import Page
from crm.models import Company, Contact, Contract, Meeting
from tasks.models import Task

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
            contracts = Contract.objects.filter(
                Q(title__icontains=query) | Q(extracted_text__icontains=query)
            )[:3]
            for contract in contracts:
                if contract.id in seen_ids: continue
                seen_ids.add(contract.id)
                
                context_parts.append(f"CONTRACT: {contract.title} (Company: {contract.company.name}, Status: {contract.status})")
                context_parts.append(f"  > Details: Amount: {contract.amount}, Start: {contract.start_date}, End: {contract.end_date}")
                if contract.extracted_text:
                    preview = contract.extracted_text[:2000] + "..." if len(contract.extracted_text) > 2000 else contract.extracted_text
                    context_parts.append(f"  > EXTRACTED CONTENT: {preview}")
                
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
