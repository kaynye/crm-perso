from django.db import models
import uuid

class Database(models.Model):
    VIEW_TYPES = (
        ('table', 'Table'),
        ('board', 'Board'),
        ('list', 'List'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    page = models.OneToOneField('pages.Page', on_delete=models.CASCADE, related_name='database_schema', null=True, blank=True)
    view_type = models.CharField(max_length=20, choices=VIEW_TYPES, default='table')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Property(models.Model):
    PROPERTY_TYPES = (
        ('text', 'Text'),
        ('number', 'Number'),
        ('select', 'Select'),
        ('checkbox', 'Checkbox'),
        ('date', 'Date'),
        ('relation', 'Relation'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    database = models.ForeignKey(Database, related_name='properties', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=PROPERTY_TYPES, default='text')
    config = models.JSONField(default=dict, blank=True) # For select options, etc.
    
    class Meta:
        verbose_name_plural = "Properties"

    def __str__(self):
        return f"{self.name} ({self.type})"

class PropertyValue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page = models.ForeignKey('pages.Page', related_name='property_values', on_delete=models.CASCADE)
    property = models.ForeignKey(Property, related_name='values', on_delete=models.CASCADE)
    value = models.JSONField(null=True, blank=True) # Flexible storage

    class Meta:
        unique_together = ('page', 'property')

    def __str__(self):
        return f"{self.page.title} - {self.property.name}: {self.value}"
