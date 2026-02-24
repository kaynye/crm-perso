from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from crm.models import Space, Contract
from ai_assistant.tools.analytics import AnalyticsTools

User = get_user_model()

class AnalyticsFilterTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Analytics")
        self.user = User.objects.create_user(username='analyst', email='a@test.com', password='pw', organization=self.org)
        
        self.space = Space.objects.create(name="Expenséo", organization=self.org)
        Contract.objects.create(title="Contract 1", space=self.space, amount=100, organization=self.org)
        Contract.objects.create(title="Contract 2", space=self.space, amount=200, organization=self.org)

    def test_space_name_filter(self):
        # Pass 'space_name' specifically, as the LLM did
        filters = {'space_name': 'Expenséo'}
        result = AnalyticsTools.analyze_data(
            entity_type='contract', 
            metric='count', 
            filters=filters,
            user=self.user
        )
        self.assertIn("Total contracts", result)
        self.assertIn("2", result)
