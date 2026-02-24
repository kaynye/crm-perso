from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('crm', '0017_populate_space_types'),
    ]

    operations = [
        # 1. Create the new through model
        migrations.CreateModel(
            name='SpaceMember',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('admin', 'Admin'), ('editor', 'Éditeur'), ('spectator', 'Spectateur')], default='editor', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('space', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='crm.space')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('space', 'user')},
            },
        ),
        # 2. Drop the old implicit M2M field and table
        migrations.RemoveField(
            model_name='space',
            name='members',
        ),
        # 3. Add the field back with the through model
        migrations.AddField(
            model_name='space',
            name='members',
            field=models.ManyToManyField(blank=True, related_name='spaces', through='crm.SpaceMember', to=settings.AUTH_USER_MODEL),
        ),
    ]
