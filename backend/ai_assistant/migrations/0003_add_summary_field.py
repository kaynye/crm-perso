from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('ai_assistant', '0002_message_sources'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='summary',
            field=models.TextField(blank=True, null=True),
        ),
    ]
