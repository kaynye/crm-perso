from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Company
from pages.models import Page

@receiver(post_save, sender=Company)
def create_company_wiki_page(sender, instance, created, **kwargs):
    if created:
        # Create a Wiki page for the new company
        Page.objects.create(
            title=instance.name,
            page_type='wiki',
            company=instance,
            content=f'{{"blocks": [{{"type": "header", "data": {{"text": "{instance.name} Wiki", "level": 1}}}}]}}'
        )
