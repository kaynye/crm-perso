from django.db import models
from django.conf import settings
import uuid
import secrets

class SpaceType(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='space_types')
    
    # Modules
    has_contracts = models.BooleanField(default=False)
    has_meetings = models.BooleanField(default=True)
    has_documents = models.BooleanField(default=True)
    has_tasks = models.BooleanField(default=True)
    has_contacts = models.BooleanField(default=True)
    
    vocabulary = models.JSONField(default=dict, blank=True, help_text="e.g. {'contact': 'Membre'}")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Space(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.ForeignKey(SpaceType, on_delete=models.PROTECT, related_name='spaces', null=True)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='spaces', blank=True, through='SpaceMember')
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    tags = models.CharField(max_length=255, blank=True) # Comma separated for now
    github_repo = models.CharField(max_length=255, blank=True, null=True, help_text="Format: owner/repo")
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='spaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Spaces"

    def __str__(self):
        return self.name

class SpaceMember(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('editor', 'Éditeur'),
        ('spectator', 'Spectateur'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='editor')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('space', 'user')
        
    def __str__(self):
        return f"{self.user} - {self.space.name} ({self.role})"

class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, related_name='contacts', on_delete=models.CASCADE, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    position = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    tags = models.CharField(max_length=255, blank=True)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='contacts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Contract(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('signed', 'Signed'),
        ('finished', 'Finished'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, related_name='contracts', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    file = models.FileField(upload_to='contracts/', null=True, blank=True)
    extracted_text = models.TextField(blank=True, null=True)
    content = models.JSONField(default=dict, blank=True, help_text="EditorJS content")
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='contracts')
    created_by = models.ForeignKey('core.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_contracts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ContractTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    content = models.JSONField(default=dict, blank=True, help_text="EditorJS structure")
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='contract_templates')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Meeting(models.Model):
    TYPE_CHOICES = (
        ('phone', 'Phone'),
        ('in_person', 'In Person'),
        ('video', 'Video Call'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, related_name='meetings', on_delete=models.CASCADE)
    contract = models.ForeignKey(Contract, related_name='meetings', on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    date = models.DateTimeField(null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='video')
    notes = models.TextField(blank=True) # Editor.js JSON
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='meetings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, related_name='documents', on_delete=models.CASCADE, null=True, blank=True)
    contract = models.ForeignKey(Contract, related_name='documents', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='documents')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class MeetingTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    content = models.TextField(help_text="JSON structure for EditorJS")
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='meeting_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class SharedLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.CharField(max_length=64, unique=True, db_index=True, editable=False)
    password = models.CharField(max_length=128, blank=True, null=True, help_text="Hashed password for guest access")
    
    # Scope (can be linked to a Company or a specific Project/Contract)
    space = models.ForeignKey(Space, null=True, blank=True, on_delete=models.CASCADE, related_name='shared_links')
    contract = models.ForeignKey(Contract, null=True, blank=True, on_delete=models.CASCADE, related_name='shared_links')
    
    # Permissions
    allow_tasks = models.BooleanField(default=True)
    allow_task_creation = models.BooleanField(default=False)
    allow_meetings = models.BooleanField(default=True)
    allow_meeting_creation = models.BooleanField(default=False)
    allow_documents = models.BooleanField(default=True)
    allow_document_upload = models.BooleanField(default=False)
    
    # Metadata
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.contract or self.space
        return f"Shared Link for {target}"

class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    space = models.ForeignKey(Space, on_delete=models.CASCADE, related_name='activities')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='activities')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    entity_type = models.CharField(max_length=50) # e.g. 'Document', 'Task', 'Member'
    entity_name = models.CharField(max_length=255) # Name of the document, task, etc. at the time of action
    details = models.JSONField(default=dict, blank=True, help_text="Stores change deltas like {'old_status': 'draft', 'new_status': 'signed'}")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} {self.action} {self.entity_type} '{self.entity_name}' in {self.space.name}"
