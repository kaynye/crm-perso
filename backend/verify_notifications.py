import os
import django
import sys

# Setup Django environment
sys.path.append('/Users/voumby/Documents/cms/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import User, Notification
from tasks.models import Task
from crm.models import Space, SpaceMember, Contract

def verify_system():
    print("--- Starting Verification ---")
    
    # 0. Get/Create Organization
    from core.models import Organization
    org = Organization.objects.first()
    if not org:
        org = Organization.objects.create(name='Test Org')

    # 1. Get/Create Users
    user1 = User.objects.filter(email='admin@demo.fr').first() or User.objects.first()
    if not user1:
        user1 = User.objects.create(username='admin_test', email='admin_test@test.com', first_name='Admin', organization=org)
    elif not user1.organization:
        user1.organization = org
        user1.save()
    
    user2 = User.objects.exclude(id=user1.id).first()
    if not user2:
        user2 = User.objects.create(username='user2_test', email='user2_test@test.com', first_name='User2', organization=org)
    elif not user2.organization:
        user2.organization = org
        user2.save()
    
    # 2. Get/Create a space
    space = Space.objects.filter(organization=user1.organization).first()
    if not space:
        space = Space.objects.create(name='Test Space', organization=user1.organization)

    SpaceMember.objects.get_or_create(space=space, user=user1, role='admin')
    SpaceMember.objects.get_or_create(space=space, user=user2, role='editor')

    # Clear previous notifications for clean test
    Notification.objects.all().delete()
    
    # 3. Test Task Assignment Trigger
    print("Testing task assignment trigger...")
    task = Task.objects.create(
        title="Test Task for Notification",
        space=space,
        assigned_to=user1, # Initial assignment
        created_by=user1,
        organization=user1.organization if user1.organization else None
    )
    
    # We need to test it through the viewset to trigger the `perform_update` logic because the logic is in the ViewSet, not the Model save method.
    # Ah! The notification logic is in views.py `perform_update`. Let's test using Django Test Client.
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    
    # Generate tokens
    token1 = str(RefreshToken.for_user(user1).access_token)
    token2 = str(RefreshToken.for_user(user2).access_token)
    
    # Helper lambda
    auth = lambda token: {'HTTP_AUTHORIZATION': f'Bearer {token}'}

    response = client.patch(f'/api/tasks/{task.id}/', {'assigned_to': str(user2.id)}, format='json', **auth(token1))
    if response.status_code == 200:
        notifs = Notification.objects.filter(recipient=user2, type='task_assigned')
        if notifs.exists():
            print("✅ Task assignment notification created successfully!")
            print(f"   Message: {notifs.first().message}")
        else:
            print("❌ Task assignment notification failed to create.")
    else:
        print(f"❌ Failed to update task via API: {response.data}")

    # 4. Test Contract Signed Trigger
    print("\nTesting contract signed trigger...")
    contract = Contract.objects.create(
        title="Test Contract for Notification",
        space=space,
        status='draft',
        organization=user1.organization if user1.organization else None
    )
    
    response = client.patch(f'/api/crm/contracts/{contract.id}/', {'status': 'signed'}, format='json', **auth(token1))
    if response.status_code == 200:
        notifs = Notification.objects.filter(recipient=user2, type='contract_signed')
        if notifs.exists():
            print("✅ Contract signed notification created successfully!")
            print(f"   Message: {notifs.first().message}")
        else:
            print("❌ Contract signed notification failed to create.")
    else:
        print(f"❌ Failed to update contract via API: {response.data}")

    # 5. Check API Endpoint
    print("\nTesting API Endpoints...")
    response = client.get('/api/notifications/', **auth(token2))
    if response.status_code == 200:
        results = response.data.get('results', response.data)
        print(f"✅ Reached API Endpoint. Found {len(results)} notifications.")
        if len(results) > 0:
            notif_id = results[0]['id']
            # Test Mark read
            read_resp = client.post(f'/api/notifications/{notif_id}/mark_read/', **auth(token2))
            if read_resp.status_code == 200:
                print("✅ Successfully marked single notification as read.")
            
            # Test mark all read
            all_read_resp = client.post('/api/notifications/mark_all_read/', **auth(token2))
            if all_read_resp.status_code == 200:
                print("✅ Successfully marked all notifications as read.")
    else:
        print(f"❌ Failed to reach API endpoint: {response.status_code}")

if __name__ == '__main__':
    verify_system()
