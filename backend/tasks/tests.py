from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from core.models import Organization
from tasks.models import Task
from rest_framework import status

User = get_user_model()

class OrganizationIsolationTest(TestCase):
    def setUp(self):
        self.org_a = Organization.objects.create(name="Org A")
        self.org_b = Organization.objects.create(name="Org B")
        
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='password123',
            organization=self.org_a
        )
        
        # Create tasks for both orgs
        self.task_a = Task.objects.create(
            title="Task A",
            organization=self.org_a
        )
        self.task_b = Task.objects.create(
            title="Task B",
            organization=self.org_b
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.superuser)

    def test_superuser_limited_by_organization(self):
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only see Task A
        task_ids = [task['id'] for task in response.data['results']]
        self.assertIn(str(self.task_a.id), task_ids)
        self.assertNotIn(str(self.task_b.id), task_ids)

    def test_superuser_without_organization_sees_all(self):
        self.superuser.organization = None
        self.superuser.save()
        
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should see both
        task_ids = [task['id'] for task in response.data['results']]
        self.assertIn(str(self.task_a.id), task_ids)
        self.assertIn(str(self.task_b.id), task_ids)
