# Generated manually
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('tasks', '0007_task_created_by'),
        ('crm', '0015_rename_company_to_space'),
    ]

    operations = [
        migrations.RenameField(
            model_name='task',
            old_name='company',
            new_name='space',
        ),
        migrations.RemoveField(
            model_name='task',
            name='contract',
        ),
    ]
