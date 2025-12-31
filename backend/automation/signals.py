from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AutomationRule
from django.apps import apps
from django.template import Template, Context
from django.core.mail import send_mail
# Import task creation if needed, or use a service
from tasks.models import Task
from crm.models import Contract
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=Task)
@receiver(post_save, sender=Contract)
def trigger_automation(sender, instance, created, **kwargs):
    model_name = sender._meta.model_name # 'task' or 'contract'
    event_type = 'create' if created else 'update'
    
    # Find matching rules
    rules = AutomationRule.objects.filter(
        organization=instance.organization,
        trigger_model=model_name,
        trigger_event=event_type,
        is_active=True
    )
    
    for rule in rules:
        # Check condition
        if rule.condition_field and rule.condition_value:
            field_value = getattr(instance, rule.condition_field, None)
            # Simple string comparison for now
            if str(field_value) != rule.condition_value:
                continue
        
        # Execute Action
        execute_action(rule, instance)

def execute_action(rule, instance):
    config = rule.action_config
    
    if rule.action_type == 'send_email':
        recipient_id = config.get('recipient_id')
        subject_template = config.get('subject', 'Automation Notification: {{ instance }}')
        message_template = config.get('message', 'This is an automated message regarding {{ instance }}.')
        
        recipient = None
        if recipient_id:
            try:
                recipient = User.objects.get(id=recipient_id, organization=rule.organization)
            except User.DoesNotExist:
                print(f"Automation Error: User {recipient_id} not found")
                return

        if recipient and recipient.email:
            # Simple template rendering
            ctx = Context({'instance': instance})
            subject = Template(subject_template).render(ctx)
            message = Template(message_template).render(ctx)
            
            send_mail(
                subject,
                message,
                'noreply@crm.com', # Should be config
                [recipient.email],
                fail_silently=True
            )
            print(f"Automation: Email sent to {recipient.email}")

    elif rule.action_type == 'create_task':
        assigned_to_id = config.get('assigned_to_id')
        title_template = config.get('title', 'Follow up on {{ instance }}')
        
        assigned_to = None
        if assigned_to_id:
            try:
                assigned_to = User.objects.get(id=assigned_to_id, organization=rule.organization)
            except User.DoesNotExist:
                pass
        
        ctx = Context({'instance': instance})
        title = Template(title_template).render(ctx)
        
        Task.objects.create(
            title=title,
            organization=instance.organization,
            assigned_to=assigned_to,
            # Link to the trigger object if possible
            company=getattr(instance, 'company', None) if hasattr(instance, 'company') else None,
            contract=instance if isinstance(instance, Contract) else getattr(instance, 'contract', None),
            # Default status todo
        )
        print(f"Automation: Task created '{title}'")
