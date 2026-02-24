# Generated manually
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('crm', '0014_contract_created_by'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Company',
            new_name='Space',
        ),
        migrations.RenameField(
            model_name='contact',
            old_name='company',
            new_name='space',
        ),
        migrations.RenameField(
            model_name='contract',
            old_name='company',
            new_name='space',
        ),
        migrations.RenameField(
            model_name='document',
            old_name='company',
            new_name='space',
        ),
        migrations.RenameField(
            model_name='meeting',
            old_name='company',
            new_name='space',
        ),
        migrations.RenameField(
            model_name='sharedlink',
            old_name='company',
            new_name='space',
        ),
        migrations.AlterModelOptions(
            name='space',
            options={'verbose_name_plural': 'Spaces'},
        ),
    ]
