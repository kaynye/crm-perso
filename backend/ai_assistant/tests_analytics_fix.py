from django.test import TestCase
from django.contrib.auth import get_user_model
from core.models import Organization
from crm.models import Company, Contract
from ai_assistant.tools.analytics import AnalyticsTools

User = get_user_model()

class AnalyticsFilterTest(TestCase):
    def setUp(self):
        self.org = Organization.objects.create(name="Org Analytics")
        self.user = User.objects.create_user(username='analyst', email='a@test.com', password='pw', organization=self.org)
        
        self.company = Company.objects.create(name="Expenséo", organization=self.org)
        Contract.objects.create(title="Contract 1", company=self.company, amount=100, organization=self.org)
        Contract.objects.create(title="Contract 2", company=self.company, amount=200, organization=self.org)

    def test_company_name_filter(self):
        # Pass 'company_name' specifically, as the LLM did
        filters = {'company_name': 'Expenséo'}
        result = AnalyticsTools.analyze_data(
            entity_type='contract', 
            metric='count', 
            filters=filters,
            user=self.user
        )
        self.assertIn("Total contracts", result)
        self.assertIn("2", result)
