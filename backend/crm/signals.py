from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from crum import get_current_user
from core.models import Notification
from .models import Space, ActivityLog, SpaceMember
from pages.models import Page
from core.services.fcm import send_push_notification

@receiver(post_save, sender=Space)
def create_space_wiki_page(sender, instance, created, **kwargs):
        Page.objects.create(
            title=instance.name,
            page_type='wiki',
            space=instance,
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

from django.db.models.signals import post_delete
from .models import Document, Contract

@receiver(post_delete, sender=Document)
def delete_document_file(sender, instance, **kwargs):
    """
    Deletes the file from filesystem/S3 when the Document object is deleted.
    """
    if instance.file:
        instance.file.delete(save=False)

@receiver(post_delete, sender=Contract)
def delete_contract_file(sender, instance, **kwargs):
    """
    Deletes the file from filesystem/S3 when the Contract object is deleted.
    """
    if hasattr(instance, 'file') and instance.file:
        instance.file.delete(save=False)

# --- New Signals for ActivityLog & Notifications ---

@receiver(post_save, sender=SpaceMember)
def spacemember_activity_log_post_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if created:
        name = f"{instance.user.first_name} {instance.user.last_name}".strip() or instance.user.email
        ActivityLog.objects.create(
            space=instance.space, actor=user, action='created',
            entity_type='Membre', entity_name=name
        )

@receiver(post_delete, sender=SpaceMember)
def spacemember_activity_log_post_delete(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    name = f"{instance.user.first_name} {instance.user.last_name}".strip() or instance.user.email
    ActivityLog.objects.create(
        space=instance.space, actor=user, action='deleted',
        entity_type='Membre', entity_name=name
    )

@receiver(pre_save, sender=Contract)
def capture_old_contract_state(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Contract.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Contract.DoesNotExist:
            pass

@receiver(post_save, sender=Contract)
def contract_activity_log_post_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return

    if created:
        if instance.space:
            ActivityLog.objects.create(
                space=instance.space, actor=user, action='created',
                entity_type='Contrat', entity_name=instance.title
            )
    else:
        old_status = getattr(instance, '_old_status', None)
        details = {}
        if old_status and old_status != instance.status:
            details['status'] = {'old': old_status, 'new': instance.status}
            
            # Notification on sign
            if instance.status == 'signed' and old_status != 'signed' and instance.space:
                members = instance.space.members.exclude(id=user.id)
                notifications = []
                title = "Contrat signé"
                message = f"Le contrat '{instance.title}' a été signé."
                link = f"/crm/spaces/{instance.space.id}?tab=contracts"
                
                for member in members:
                    notifications.append(
                        Notification(
                            recipient=member, actor=user, type='contract_signed',
                            title=title, message=message, link=link
                        )
                    )
                    send_push_notification(
                        user=member,
                        title=title,
                        body=message,
                        data={'url': link}
                    )
                    
                if notifications:
                    Notification.objects.bulk_create(notifications)

        if details and instance.space:
            ActivityLog.objects.create(
                space=instance.space, actor=user, action='updated',
                entity_type='Contrat', entity_name=instance.title, details=details
            )

@receiver(post_delete, sender=Contract)
def contract_activity_log_post_delete(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if instance.space:
        ActivityLog.objects.create(
            space=instance.space, actor=user, action='deleted',
            entity_type='Contrat', entity_name=instance.title
        )

@receiver(post_save, sender=Meeting)
def meeting_activity_log_post_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if instance.space:
        action = 'created' if created else 'updated'
        ActivityLog.objects.create(
            space=instance.space, actor=user, action=action,
            entity_type='Réunion', entity_name=instance.title
        )

@receiver(post_delete, sender=Meeting)
def meeting_activity_log_post_delete(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if instance.space:
        ActivityLog.objects.create(
            space=instance.space, actor=user, action='deleted',
            entity_type='Réunion', entity_name=instance.title
        )

@receiver(post_save, sender=Document)
def document_activity_log_post_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if created and instance.space:
        ActivityLog.objects.create(
            space=instance.space, actor=user, action='created',
            entity_type='Document', entity_name=instance.name
        )

@receiver(post_delete, sender=Document)
def document_activity_log_post_delete(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated: return
    if instance.space:
        ActivityLog.objects.create(
            space=instance.space, actor=user, action='deleted',
            entity_type='Document', entity_name=instance.name
        )
