from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from crm.models import Space, Contact, Contract, Meeting
from tasks.models import Task
from pages.models import Page
from .vector_store import VectorStore
from .rag import RAGService

def update_vector_index(instance, type_name, text_content, title, organization_id):
    """
    Helper to update the vector index for a single instance.
    """
    try:
        doc_id = f"{type_name}_{instance.id}"
        metadata = {
            "type": type_name, 
            "title": title, 
            "id": str(instance.id),
            "organization_id": str(organization_id)
        }
        
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

# --- Space ---
@receiver(post_save, sender=Space)
def index_space(sender, instance, **kwargs):
    if not instance.organization: return
    text = f"Space: {instance.name}\nIndustry: {instance.industry}\nSize: {instance.size}\nAddress: {instance.address}\nNotes: {instance.notes}"
    update_vector_index(instance, "space", text, instance.name, instance.organization.id)

@receiver(post_delete, sender=Space)
def delete_space_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "space")

# --- Contract ---
@receiver(post_save, sender=Contract)
def index_contract(sender, instance, **kwargs):
    if not instance.organization: return
    text = f"Contract: {instance.title}\nSpace: {instance.space.name if instance.space else 'N/A'}\nStatus: {instance.status}\nAmount: {instance.amount}\nContent: {instance.extracted_text or ''}"
    update_vector_index(instance, "contract", text, instance.title, instance.organization.id)

@receiver(post_delete, sender=Contract)
def delete_contract_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "contract")

# --- Meeting ---
@receiver(post_save, sender=Meeting)
def index_meeting(sender, instance, **kwargs):
    if not instance.organization: return
    clean_notes = RAGService._parse_notes(instance.notes)
    text = f"Meeting: {instance.title}\nDate: {instance.date}\nSpace: {instance.space.name if instance.space else 'N/A'}\nNotes: {clean_notes}"
    update_vector_index(instance, "meeting", text, instance.title, instance.organization.id)

@receiver(post_delete, sender=Meeting)
def delete_meeting_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "meeting")

# --- Task ---
@receiver(post_save, sender=Task)
def index_task(sender, instance, **kwargs):
    if not instance.organization: return
    assigned = instance.assigned_to.username if instance.assigned_to else 'Unassigned'
    text = f"Task: {instance.title}\nStatus: {instance.status}\nAssigned: {assigned}\nDescription: {instance.description}"
    update_vector_index(instance, "task", text, instance.title, instance.organization.id)

@receiver(post_delete, sender=Task)
def delete_task_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "task")

# --- Page ---
@receiver(post_save, sender=Page)
def index_page(sender, instance, **kwargs):
    if not instance.organization: return
    clean_content = RAGService._parse_notes(instance.content)
    text = f"Page: {instance.title}\nType: {instance.page_type}\nContent: {clean_content}"
    update_vector_index(instance, "page", text, instance.title, instance.organization.id)

@receiver(post_delete, sender=Page)
def delete_page_index(sender, instance, **kwargs):
    delete_from_vector_index(instance, "page")
