from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from crum import get_current_user
from tasks.models import Task
from crm.models import ActivityLog
from core.models import Notification

@receiver(pre_save, sender=Task)
def capture_old_task_state(sender, instance, **kwargs):
    """
    Capture the state of the task before it is saved so we can compare
    changes in post_save.
    """
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_assigned_to = old_instance.assigned_to
        except Task.DoesNotExist:
            pass

@receiver(post_save, sender=Task)
def task_post_save_actions(sender, instance, created, **kwargs):
    """
    Handle ActivityLog and Notifications using django-crum to get the user.
    """
    user = get_current_user()
    
    # We only log actions if there is an active user (e.g. not management commands)
    if not user or not user.is_authenticated:
        return

    # 1. Handle Creation
    if created:
        if hasattr(instance, 'space') and instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=user,
                action='created',
                entity_type='Tâche',
                entity_name=instance.title
            )
        
        # Notification on assignment
        if instance.assigned_to and instance.assigned_to != user:
            Notification.objects.create(
                recipient=instance.assigned_to,
                actor=user,
                type='task_assigned',
                title=f"Nouvelle tâche assignée: {instance.title}",
                message=f"La tâche '{instance.title}' vous a été assignée.",
                link='/tasks'
            )
            
    # 2. Handle Update
    else:
        old_status = getattr(instance, '_old_status', None)
        old_assignee = getattr(instance, '_old_assigned_to', None)
        
        details = {}
        if old_status and old_status != instance.status:
            details['status'] = {
                'old': old_status,
                'new': instance.status
            }
            
        if hasattr(instance, '_old_assigned_to') and old_assignee != instance.assigned_to:
            details['assignee'] = {
                'old': f"{old_assignee.first_name} {old_assignee.last_name}".strip() if old_assignee else None,
                'new': f"{instance.assigned_to.first_name} {instance.assigned_to.last_name}".strip() if instance.assigned_to else None,
            }
            
            # Notification on re-assignment
            if instance.assigned_to and instance.assigned_to != user:
                Notification.objects.create(
                    recipient=instance.assigned_to,
                    actor=user,
                    type='task_assigned',
                    title=f"Tâche réassignée: {instance.title}",
                    message=f"La tâche '{instance.title}' vous a été assignée.",
                    link='/tasks'
                )

        if details and hasattr(instance, 'space') and instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=user,
                action='updated',
                entity_type='Tâche',
                entity_name=instance.title,
                details=details
            )

@receiver(post_delete, sender=Task)
def task_post_delete_actions(sender, instance, **kwargs):
    user = get_current_user()
    if not user or not user.is_authenticated:
        return
        
    if hasattr(instance, 'space') and instance.space:
        ActivityLog.objects.create(
            space=instance.space,
            actor=user,
            action='deleted',
            entity_type='Tâche',
            entity_name=instance.title
        )
