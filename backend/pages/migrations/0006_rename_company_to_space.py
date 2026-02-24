# Generated manually
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('pages', '0005_alter_page_organization'),
        ('crm', '0015_rename_company_to_space'),
    ]

    operations = [
        migrations.RenameField(
            model_name='page',
            old_name='company',
            new_name='space',
        ),
    ]
