from django.db import models
from django.conf import settings
import uuid

class AutomationRule(models.Model):
    TRIGGER_MODELS = (
        ('task', 'Task'),
        ('contract', 'Contract'),
    )
    TRIGGER_EVENTS = (
        ('create', 'Created'),
        ('update', 'Updated'),
    )
    ACTION_TYPES = (
        ('send_email', 'Send Email'),
        ('create_task', 'Create Task'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='automation_rules')
    
    # Trigger
    trigger_model = models.CharField(max_length=50, choices=TRIGGER_MODELS)
    trigger_event = models.CharField(max_length=50, choices=TRIGGER_EVENTS)
    
    # Condition (Simple for now: field == value)
    condition_field = models.CharField(max_length=100, blank=True, help_text="Field to check, e.g., 'status'")
    condition_value = models.CharField(max_length=100, blank=True, help_text="Value to match, e.g., 'done'")
    
    # Action
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    action_config = models.JSONField(default=dict, help_text="Configuration for the action (recipient, templates, etc.)")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.organization})"
