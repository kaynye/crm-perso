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
    
    # Advanced Conditions (JSON List): [{ "field": "status", "operator": "equals", "value": "done" }]
    conditions = models.JSONField(default=list, blank=True, help_text="List of conditions (AND logic)")
    
    # Actions (JSON List): [{ "type": "create_task", "config": {...} }]
    actions = models.JSONField(default=list, help_text="List of actions to execute")
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.organization})"

class AutomationLog(models.Model):
    STATUS_CHOICES = (
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('partial', 'Partial Success'),
    )
    
    rule = models.ForeignKey(AutomationRule, on_delete=models.CASCADE, related_name='logs')
    # Link to the object that triggered it (Generic relation would be best, but simple string for now is easier for logs)
    target_model = models.CharField(max_length=50) # e.g. 'task'
    target_id = models.CharField(max_length=50)    # e.g. UUID
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    details = models.TextField(blank=True, help_text="Log details or error message")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
