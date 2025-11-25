from crm.models import Company, Contact, Contract, Meeting
from django.utils import timezone
from datetime import datetime

class CRMTools:
    @staticmethod
    def create_company(name, industry="", size="", website=""):
        """Creates a new company."""
        company, created = Company.objects.get_or_create(
            name=name,
            defaults={
                'industry': industry,
                'size': size,
                'website': website
            }
        )
        if created:
            return {
                "message": f"Company '{name}' created successfully.",
                "action": {
                    "type": "NAVIGATE",
                    "label": f"View {name}",
                    "url": f"/crm/companies/{company.id}"
                }
            }
        else:
            return f"Company '{name}' already exists."

    @staticmethod
    def create_contact(first_name, last_name, company_name="", email="", position=""):
        """Creates a new contact and links to a company if found."""
        company = None
        if company_name:
            company = Company.objects.filter(name__icontains=company_name).first()
        
        contact = Contact.objects.create(
            first_name=first_name,
            last_name=last_name,
            company=company,
            email=email,
            position=position
        )
        
        msg = f"Contact '{first_name} {last_name}' created."
        if company:
            msg += f" Linked to company '{company.name}'."
        else:
            msg += " No company linked."
        return msg

    @staticmethod
    def create_contract(title, company_name, amount=None, status='draft'):
        """Creates a new contract linked to a company."""
        company = Company.objects.filter(name__icontains=company_name).first()
        if not company:
            return f"Error: Company '{company_name}' not found. Please create the company first."
            
        contract = Contract.objects.create(
            title=title,
            company=company,
            amount=amount,
            status=status
        )
        return {
            "message": f"Contract '{title}' created for {company_name}.",
            "action": {
                "type": "NAVIGATE",
                "label": f"View Contract",
                "url": f"/crm/contracts/{contract.id}"
            }
        }

    @staticmethod
    def update_contract_status(title, status):
        """Updates the status of a contract."""
        contract = Contract.objects.filter(title__icontains=title).first()
        if not contract:
            return f"Error: Contract '{title}' not found."
            
        contract.status = status
        contract.save()
        return f"Contract '{contract.title}' status updated to '{status}'."

    @staticmethod
    def add_note(entity_type, entity_id, note_content):
        """Appends a note to an entity."""
        entity = None
        if entity_type == 'company':
            entity = Company.objects.filter(id=entity_id).first()
        elif entity_type == 'contact':
            entity = Contact.objects.filter(id=entity_id).first()
        elif entity_type == 'contract':
            entity = Contract.objects.filter(id=entity_id).first()
        elif entity_type == 'meeting':
            entity = Meeting.objects.filter(id=entity_id).first()
            
        if not entity:
            return f"Error: {entity_type} with ID {entity_id} not found."
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_note = f"\n\n[{timestamp}] {note_content}"
        
        if entity.notes:
            entity.notes += new_note
        else:
            entity.notes = f"[{timestamp}] {note_content}"
            
        entity.save()
        
        return {
            "message": "Note added successfully.",
            "action": {
                "type": "NAVIGATE",
                "label": f"View {entity_type.capitalize()}",
                "url": f"/crm/{entity_type if entity_type != 'company' else 'companies'}/{entity_id}" if entity_type != 'contract' else f"/crm/contracts/{entity_id}"
            }
        }
