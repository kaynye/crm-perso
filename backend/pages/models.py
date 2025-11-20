from django.db import models
import uuid

class Page(models.Model):
    PAGE_TYPES = (
        ('normal', 'Normal'),
        ('wiki', 'Wiki'),
        ('database', 'Database'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey('self', null=True, blank=True, related_name='children', on_delete=models.CASCADE)
    company = models.ForeignKey('crm.Company', null=True, blank=True, related_name='pages', on_delete=models.SET_NULL)
    database = models.ForeignKey('databases.Database', null=True, blank=True, related_name='rows', on_delete=models.CASCADE)
    path = models.TextField(db_index=True, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField(default='{}', blank=True) # JSON for Editor.js
    page_type = models.CharField(max_length=20, choices=PAGE_TYPES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def save(self, *args, **kwargs):
        # Calculate path before saving
        # We need to save first to get ID if it's new, but we use UUID so we have ID.
        # Path format: /parent_id/this_id/
        
        super().save(*args, **kwargs) # Save first to ensure we have an ID if needed (though UUID is pre-generated usually)
        
        new_path = f"/{self.id}/"
        if self.parent:
            new_path = f"{self.parent.path}{self.id}/"
        
        if self.path != new_path:
            self.path = new_path
            # Update children paths if path changed (move)
            # This is a simplified version; for robust moves we need to update all descendants.
            # For now, we just save the new path.
            super().save(update_fields=['path'])
            
            # Recursively update children
            for child in self.children.all():
                child.save() # This will trigger child's save and update its path

    def __str__(self):
        return self.title
