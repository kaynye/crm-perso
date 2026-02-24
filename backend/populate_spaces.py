import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from crm.models import SpaceType, Space
from core.models import Organization

print(f"Organizations: {Organization.objects.count()}")
print(f"SpaceTypes: {SpaceType.objects.count()}")
for st in SpaceType.objects.all():
    print(f" - {st.name} (Org: {st.organization.name})")

print(f"Spaces: {Space.objects.count()}")
for s in Space.objects.all():
    print(f" - {s.name} (Type: {s.type.name if s.type else 'None'})")

print("\n--- Running Population Script ---")

for org in Organization.objects.all():
    # Create types
    entreprise_type, _ = SpaceType.objects.get_or_create(
        organization=org,
        name='entreprise client',
        defaults={
            'has_contracts': True,
            'has_meetings': True,
            'has_documents': True,
            'has_tasks': True,
            'has_contacts': True,
            'vocabulary': {}
        }
    )
    
    SpaceType.objects.get_or_create(
        organization=org,
        name='Familiale',
        defaults={
            'has_contracts': False,
            'has_meetings': True,
            'has_documents': True,
            'has_tasks': True,
            'has_contacts': True,
            'vocabulary': {'contact': 'Membre', 'contact_plural': 'Membres'}
        }
    )
    
    SpaceType.objects.get_or_create(
        organization=org,
        name='Organisation',
        defaults={
            'has_contracts': False,
            'has_meetings': True,
            'has_documents': True,
            'has_tasks': True,
            'has_contacts': True,
            'vocabulary': {'contact': 'Membre', 'contact_plural': 'Membres'}
        }
    )

    # Update spaces for this org
    updated = Space.objects.filter(organization=org, type__isnull=True).update(type=entreprise_type)
    print(f"Updated {updated} spaces without type in org {org.name} to 'entreprise client'")

print("\n--- After Script ---")
print(f"SpaceTypes: {SpaceType.objects.count()}")
for st in SpaceType.objects.all():
    print(f" - {st.name} (Org: {st.organization.name})")

for s in Space.objects.all():
    print(f" - {s.name} (Type: {s.type.name if s.type else 'None'})")
