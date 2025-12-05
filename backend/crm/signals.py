from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Company
from pages.models import Page

@receiver(post_save, sender=Company)
def create_company_wiki_page(sender, instance, created, **kwargs):
        Page.objects.create(
            title=instance.name,
            page_type='wiki',
            company=instance,
            organization=instance.organization,
            content=f'{{"blocks": [{{"type": "header", "data": {{"text": "{instance.name} Wiki", "level": 1}}}}]}}'
        )

from .models import Contract
import os
from pypdf import PdfReader

@receiver(post_save, sender=Contract)
def extract_contract_text(sender, instance, created, **kwargs):
    """
    Extracts text from the uploaded PDF file and saves it to extracted_text.
    """
    if instance.file and not instance.extracted_text:
        try:
            file_path = instance.file.path
            if not os.path.exists(file_path):
                return

            # Only process PDFs
            if not file_path.lower().endswith('.pdf'):
                return

            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            
            # Save extracted text without triggering signals again
            instance.extracted_text = text
            instance.save(update_fields=['extracted_text'])
            print(f"Successfully extracted text from {instance.title}")
            
        except Exception as e:
            print(f"Error extracting text from contract {instance.id}: {str(e)}")

from .models import Meeting
from integrations.services import GoogleCalendarService

@receiver(post_save, sender=Meeting)
def sync_meeting_to_google(sender, instance, created, **kwargs):
    """
    Syncs the meeting to Google Calendar if the user has connected their account.
    """
    if instance.created_by:
        # We only sync if there's a user attached
        # Ideally we should check if it's a new meeting or update
        # For now, create_event handles creation. update_event logic is needed for updates.
        # But let's start with creation.
        if created:
            GoogleCalendarService.create_event(instance.created_by, instance)
        # else:
        #     GoogleCalendarService.update_event(instance.created_by, instance)
