import os
import django
import sys

sys.path.append('/Users/voumby/Documents/cms/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tasks.models import Task
from core.models import User
from crm.models import Space
user1 = User.objects.first()
user2 = User.objects.exclude(id=user1.id).first()
space = Space.objects.first()

print(f"User1: {user1.id}, User2: {user2.id}")
task = Task.objects.create(title="Signal Test Dbg", space=space, assigned_to=user1, created_by=user1, organization=user1.organization)
print("Created task with assignee:", task.assigned_to.id)

print("\n--- Testing Model Save ---")
import crum
crum.set_current_user(user1)

task.assigned_to = user2
task.save()

from core.models import Notification
notifs = Notification.objects.filter(recipient=user2, type='task_assigned')
print("Notifs found:", notifs.count())
