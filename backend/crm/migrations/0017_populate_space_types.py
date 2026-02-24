# Generated manually
from django.db import migrations

def populate_space_types(apps, schema_editor):
    Organization = apps.get_model('core', 'Organization')
    SpaceType = apps.get_model('crm', 'SpaceType')
    Space = apps.get_model('crm', 'Space')

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
        Space.objects.filter(organization=org, type__isnull=True).update(type=entreprise_type)

def reverse_populate(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0016_space_members_alter_space_organization_spacetype_and_more'),
        ('core', '0001_initial'), # Ensure core organization is loaded
    ]

    operations = [
        migrations.RunPython(populate_space_types, reverse_populate),
    ]
