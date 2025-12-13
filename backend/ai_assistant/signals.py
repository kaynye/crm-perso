from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from crm.models import Company, Contact, Contract, Meeting
from tasks.models import Task
from pages.models import Page
from .vector_store import VectorStore
from .rag import RAGService

def update_vector_index(instance, type_name, text_content, title):
    """
    Helper to update the vector index for a single instance.
    """
    try:
        doc_id = f"{type_name}_{instance.id}"
        metadata = {"type": type_name, "title": title, "id": str(instance.id)}
        
        # Upsert (add or update)
        VectorStore.add_texts(
            texts=[text_content],
            metadatas=[metadata],
            ids=[doc_id]
        )
        print(f"RAG Index Updated: {doc_id}")
    except Exception as e:
        print(f"Error updating RAG index for {type_name} {instance.id}: {e}")

def delete_from_vector_index(instance, type_name):
    """
    Helper to delete from the vector index.
    """
    try:
        doc_id = f"{type_name}_{instance.id}"
        VectorStore.delete_texts(ids=[doc_id])
        print(f"RAG Index Deleted: {doc_id}")
    except Exception as e:
        print(f"Error deleting from RAG index for {type_name} {instance.id}: {e}")

# --- Company ---
@receiver(post_save, sender=Company)
def index_company(sender, instance, **kwargs):
    text = f"Company: {instance.name}\nIndustry: {instance.industry}\nSize: {instance.size}\nAddress: {instance.address}\nNotes: {instance.notes}"
    update_vector_index(instance, "company", text, instance.name)

@receiver(post_delete, sender=Company)
def delete_company_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "company")

# --- Contract ---
@receiver(post_save, sender=Contract)
def index_contract(sender, instance, **kwargs):
    text = f"Contract: {instance.title}\nCompany: {instance.company.name if instance.company else 'N/A'}\nStatus: {instance.status}\nAmount: {instance.amount}\nContent: {instance.extracted_text or ''}"
    update_vector_index(instance, "contract", text, instance.title)

@receiver(post_delete, sender=Contract)
def delete_contract_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "contract")

# --- Meeting ---
@receiver(post_save, sender=Meeting)
def index_meeting(sender, instance, **kwargs):
    clean_notes = RAGService._parse_notes(instance.notes)
    text = f"Meeting: {instance.title}\nDate: {instance.date}\nCompany: {instance.company.name if instance.company else 'N/A'}\nNotes: {clean_notes}"
    update_vector_index(instance, "meeting", text, instance.title)

@receiver(post_delete, sender=Meeting)
def delete_meeting_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "meeting")

# --- Task ---
@receiver(post_save, sender=Task)
def index_task(sender, instance, **kwargs):
    assigned = instance.assigned_to.username if instance.assigned_to else 'Unassigned'
    text = f"Task: {instance.title}\nStatus: {instance.status}\nAssigned: {assigned}\nDescription: {instance.description}"
    update_vector_index(instance, "task", text, instance.title)

@receiver(post_delete, sender=Task)
def delete_task_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "task")

# --- Page ---
@receiver(post_save, sender=Page)
def index_page(sender, instance, **kwargs):
    clean_content = RAGService._parse_notes(instance.content)
    text = f"Page: {instance.title}\nType: {instance.page_type}\nContent: {clean_content}"
    update_vector_index(instance, "page", text, instance.title)

@receiver(post_delete, sender=Page)
def delete_page_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "page")
