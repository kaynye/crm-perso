from django.db import models
from django.conf import settings
import uuid

class Company(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    tags = models.CharField(max_length=255, blank=True) # Comma separated for now
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='companies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name

class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, related_name='contacts', on_delete=models.CASCADE, null=True, blank=True)
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
    company = models.ForeignKey(Company, related_name='contracts', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    file = models.FileField(upload_to='contracts/', null=True, blank=True)
    extracted_text = models.TextField(blank=True, null=True)
    organization = models.ForeignKey('core.Organization', on_delete=models.CASCADE, related_name='contracts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Meeting(models.Model):
    TYPE_CHOICES = (
        ('phone', 'Phone'),
        ('in_person', 'In Person'),
        ('video', 'Video Call'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.ForeignKey(Company, related_name='meetings', on_delete=models.CASCADE)
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
    company = models.ForeignKey(Company, related_name='documents', on_delete=models.CASCADE, null=True, blank=True)
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
