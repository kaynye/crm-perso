from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AutomationRule, AutomationLog
from django.apps import apps
from django.template import Template, Context
from django.core.mail import send_mail
from tasks.models import Task
from crm.models import Contract, Meeting
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@receiver(post_save, sender=Task)
@receiver(post_save, sender=Contract)
@receiver(post_save, sender=Meeting)
def trigger_automation(sender, instance, created, **kwargs):
    try:
        model_name = sender._meta.model_name # 'task', 'contract', 'meeting'
        event_type = 'create' if created else 'update'
        
        print(f"DEBUG: Triggered {model_name} {event_type} for ID {instance.id}")

        # Find matching rules based on trigger
        rules = AutomationRule.objects.filter(
            organization=instance.organization,
            trigger_model=model_name,
            trigger_event=event_type,
            is_active=True
        )
        
        print(f"DEBUG: Found {rules.count()} rules")

        for rule in rules:
            # Check Conditions (AND logic)
            conditions = rule.conditions # JSON List
            match = True
            
            if conditions and isinstance(conditions, list):
                for cond in conditions:
                    field = cond.get('field')
                    if not field: continue
                    
                    operator = cond.get('operator', 'equals')
                    value = cond.get('value')
                    
                    # Get field value from instance
                    instance_value = getattr(instance, field, None)
                    
                    # Enhanced String Conversion
                    str_inst_val = str(instance_value) if instance_value is not None else ''
                    str_rule_val = str(value) if value is not None else ''
                    
                    print(f"DEBUG: Checking {field} ({str_inst_val}) {operator} {str_rule_val}")

                    if operator == 'equals':
                        # Flexible comparison: Exact or Case-insensitive
                        if str_inst_val != str_rule_val and str_inst_val.lower() != str_rule_val.lower():
                            match = False
                            break
                    elif operator == 'contains':
                        if str_rule_val.lower() not in str_inst_val.lower():
                            match = False
                            break
                    elif operator == 'gt':
                        try:
                            if float(instance_value) <= float(value):
                                match = False
                                break
                        except:
                            match = False
                            break
                    elif operator == 'lt':
                        try:
                            if float(instance_value) >= float(value):
                                match = False
                                break
                        except:
                            match = False
                            break
                    elif operator == 'neq':
                        if str_inst_val == str_rule_val:
                            match = False
                            break
            
            if match:
                print(f"DEBUG: Rule {rule.name} matched. Executing actions.")
                # Execute Actions
                try:
                    execute_actions(rule, instance)
                    AutomationLog.objects.create(
                        rule=rule,
                        target_model=model_name,
                        target_id=str(instance.id),
                        status='success',
                        details='All actions executed successfully'
                    )
                except Exception as e:
                    print(f"DEBUG: Action failed: {e}")
                    AutomationLog.objects.create(
                        rule=rule,
                        target_model=model_name,
                        target_id=str(instance.id),
                        status='failed',
                        details=str(e)
                    )
            else:
                print(f"DEBUG: Rule {rule.name} did not match conditions.")
                
    except Exception as e:
        print(f"DEBUG: Automation Error: {e}")

def execute_actions(rule, instance):
    actions = rule.actions # JSON List
    if not actions or not isinstance(actions, list):
        return

    # User Context for template rendering
    current_ctx = {'instance': instance}
    
    # Extract Actor (Created By)
    actor = getattr(instance, 'created_by', None)
    if actor:
        current_ctx['actor'] = actor
        # Flatten actor fields for easier access if needed, or rely on {{ actor.first_name }}
    
    # Add scalar fields safely
    for field in instance._meta.fields:
        try:
            val = getattr(instance, field.name)
            if val is not None:
                current_ctx[field.name] = str(val)
        except:
            pass
            
    ctx = Context(current_ctx)
    
    for action in actions:
        action_type = action.get('type')
        config = action.get('config', {})
        
        if action_type == 'send_email':
            recipient_id = config.get('recipient_id')
            subject_tmpl = config.get('subject', 'Automation: {{ instance }}')
            message_tmpl = config.get('message', '') 
            
            recipient = None
            if recipient_id == '__actor__':
                recipient = actor
                if not recipient:
                    print("DEBUG: Actor not found for __actor__ recipient")
                    continue
            elif recipient_id:
                try:
                    recipient = User.objects.get(id=recipient_id)
                except User.DoesNotExist:
                    print(f"User {recipient_id} not found")
                    continue
            
            if recipient and recipient.email:
                subject = Template(subject_tmpl).render(ctx)
                # message = Template(message_tmpl).render(ctx)
                
                send_mail(
                    subject,
                    f"Notification from Automation Rule: {rule.name}\n\nTriggered by: {instance}\nAction performed by: {actor}", 
                    'noreply@crm.com',
                    [recipient.email],
                    fail_silently=True
                )

        elif action_type == 'create_task':
            assigned_to_id = config.get('assigned_to_id')
            title_tmpl = config.get('title', 'Task for {{ instance }}')
            
            assigned_to = None
            if assigned_to_id == '__actor__':
                assigned_to = actor
            elif assigned_to_id:
                try:
                    assigned_to = User.objects.get(id=assigned_to_id)
                except:
                    pass
            
            title = Template(title_tmpl).render(ctx)
            
            Task.objects.create(
                title=title,
                organization=instance.organization,
                assigned_to=assigned_to,
                company=getattr(instance, 'company', None) if hasattr(instance, 'company') else None,
                contract=instance if isinstance(instance, Contract) else getattr(instance, 'contract', None),
                created_by=actor # Keep chain of ownership
            )

        elif action_type == 'update_field':
            field_name = config.get('field')
            value_raw = config.get('value')
            
            if hasattr(instance, field_name):
                # Simple type conversion could be added here if needed
                # For now assuming string compatible fields (Status, Choices, etc.)
                try:
                    setattr(instance, field_name, value_raw)
                    instance.save(update_fields=[field_name])
                    print(f"DEBUG: Updated field {field_name} to {value_raw}")
                except Exception as e:
                    print(f"DEBUG: Failed to update field {field_name}: {e}")
                    raise e # Re-raise to catch in outer loop
            else:
                print(f"DEBUG: Field {field_name} not found on model")
