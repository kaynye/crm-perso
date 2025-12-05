from core.models import Organization, User
from crm.models import Company, Contact, Contract, Meeting, Document, MeetingTemplate
from tasks.models import Task
from pages.models import Page

# Create Democorp Organization
org, created = Organization.objects.get_or_create(name="Democorp")
print(f"Organization '{org.name}' {'created' if created else 'already exists'} with ID: {org.id}")

# Migrate Users
users = User.objects.filter(organization__isnull=True)
count = users.update(organization=org)
print(f"Migrated {count} users to {org.name}")

# Migrate CRM Data
print("Migrating CRM data...")
Company.objects.filter(organization__isnull=True).update(organization=org)
Contact.objects.filter(organization__isnull=True).update(organization=org)
Contract.objects.filter(organization__isnull=True).update(organization=org)
Meeting.objects.filter(organization__isnull=True).update(organization=org)
Document.objects.filter(organization__isnull=True).update(organization=org)
MeetingTemplate.objects.filter(organization__isnull=True).update(organization=org)

# Migrate Tasks
print("Migrating Tasks...")
Task.objects.filter(organization__isnull=True).update(organization=org)

# Migrate Pages
print("Migrating Pages...")
Page.objects.filter(organization__isnull=True).update(organization=org)

print("Data migration complete!")
