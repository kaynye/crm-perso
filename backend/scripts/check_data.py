import os
import sys
import django

# Setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from crm.models import Contract, Meeting
from core.models import User

def check_data():
    u = User.objects.first()
    if not u:
        print("No users.")
        return
        
    print(f"Checking data for user: {u.email} (Org: {u.organization})")
    
    contracts = Contract.objects.filter(organization=u.organization)
    print(f"Total Contracts: {contracts.count()}")
    for c in contracts:
        print(f" - {c.title}: {c.amount} (Status: {c.status})")
        
    meetings = Meeting.objects.filter(organization=u.organization)
    print(f"Total Meetings: {meetings.count()}")

if __name__ == '__main__':
    check_data()
