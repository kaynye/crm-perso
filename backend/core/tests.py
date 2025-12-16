from django.test import TestCase
from django.contrib.admin.sites import AdminSite
from .models import User
from .admin import CustomUserAdmin

class UserAdminTest(TestCase):
    def test_organization_field_in_admin(self):
        site = AdminSite()
        user_admin = CustomUserAdmin(User, site)
        
        # Check fieldsets
        fieldsets = dict(user_admin.get_fieldsets(None))
        found_org = False
        for section, content in fieldsets.items():
            if 'organization' in content.get('fields', ()):
                found_org = True
                break
        
        self.assertTrue(found_org, "Organization field not found in UserAdmin fieldsets")
        
        # Check list_display
        self.assertIn('organization', user_admin.list_display, "Organization field not found in UserAdmin list_display")
