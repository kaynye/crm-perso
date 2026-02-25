from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    legal_name = models.CharField(max_length=255, blank=True)
    logo = models.ImageField(upload_to='organization_logos/', null=True, blank=True)
    siret = models.CharField(max_length=50, blank=True, help_text="Registration Number")
    vat_number = models.CharField(max_length=50, blank=True)
    address_billing = models.TextField(blank=True)
    custom_fields = models.JSONField(default=dict, blank=True, help_text="Flexible user-defined fields")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    is_admin = models.BooleanField(default=False)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.email

class Notification(models.Model):
    TYPE_CHOICES = (
        ('task_assigned', 'Task Assigned'),
        ('contract_signed', 'Contract Signed'),
        ('mention', 'Mentioned'),
        ('system', 'System'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_notifications')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    link = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"To {self.recipient}: {self.title}"
