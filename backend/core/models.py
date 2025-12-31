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
