from core.models import Organization, User
from crm.models import Company, Contact, Contract, Meeting, Document, MeetingTemplate
from tasks.models import Task
from pages.models import Page

def check_model(model, name):
    count = model.objects.filter(organization__isnull=True).count()
    if count > 0:
        print(f"FAIL: {count} {name} have no organization!")
    else:
        print(f"PASS: All {name} have an organization.")

print("Verifying Data Migration...")
check_model(User, "Users")
check_model(Company, "Companies")
check_model(Contact, "Contacts")
check_model(Contract, "Contracts")
check_model(Meeting, "Meetings")
check_model(Document, "Documents")
check_model(MeetingTemplate, "MeetingTemplates")
check_model(Task, "Tasks")
check_model(Page, "Pages")

democorp = Organization.objects.get(name="Democorp")
print(f"Democorp ID: {democorp.id}")
print(f"Democorp Users: {democorp.users.count()}")
