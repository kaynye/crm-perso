from crm.models import Company, Contact, Contract, Meeting
from django.utils import timezone
from datetime import datetime

class CRMTools:
    @staticmethod
    def create_company(name, industry="", size="", website="", user=None):
        """Creates a new company."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        company, created = Company.objects.get_or_create(
            name=name,
            organization=user.organization,
            defaults={
                'industry': industry,
                'size': size,
                'website': website
            }
        )
        if created:
            return {
                "message": f"Entreprise '{name}' créée avec succès.",
                "action": {
                    "type": "NAVIGATE",
                    "label": f"Voir {name}",
                    "url": f"/crm/companies/{company.id}"
                }
            }
        else:
            return f"L'entreprise '{name}' existe déjà."

    @staticmethod
    def create_contact(first_name, last_name, company_name="", email="", position="", user=None):
        """Creates a new contact and links to a company if found."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        company = None
        if company_name:
            company = Company.objects.filter(name__icontains=company_name, organization=user.organization).first()
        
        contact = Contact.objects.create(
            first_name=first_name,
            last_name=last_name,
            company=company,
            email=email,
            position=position,
            organization=user.organization
        )
        
        msg = f"Contact '{first_name} {last_name}' créé."
        if company:
            msg += f" Lié à l'entreprise '{company.name}'."
        else:
            msg += " Aucune entreprise liée."
        return msg

    @staticmethod
    def create_contract(title, company_name, amount=None, status='draft', user=None):
        """Creates a new contract linked to a company."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        company = Company.objects.filter(name__icontains=company_name, organization=user.organization).first()
        if not company:
            return f"Erreur : Entreprise '{company_name}' introuvable. Veuillez d'abord créer l'entreprise."
            
        contract = Contract.objects.create(
            title=title,
            company=company,
            amount=amount,
            status=status,
            organization=user.organization
        )
        return {
            "message": f"Contrat '{title}' créé pour {company_name}.",
            "action": {
                "type": "NAVIGATE",
                "label": f"Voir le contrat",
                "url": f"/crm/contracts/{contract.id}"
            }
        }

    @staticmethod
    def update_contract_status(title, status):
        """Updates the status of a contract."""
        contract = Contract.objects.filter(title__icontains=title).first()
        if not contract:
            return f"Erreur : Contrat '{title}' introuvable."
            
        contract.status = status
        contract.save()
        return f"Statut du contrat '{contract.title}' mis à jour vers '{status}'."

    @staticmethod
    def add_note(entity_type, entity_id, note_content, user=None):
        """Appends a note to an entity."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        entity = None
        if entity_type == 'company':
            entity = Company.objects.filter(id=entity_id, organization=user.organization).first()
        elif entity_type == 'contact':
            entity = Contact.objects.filter(id=entity_id, organization=user.organization).first()
        elif entity_type == 'contract':
            entity = Contract.objects.filter(id=entity_id, organization=user.organization).first()
        elif entity_type == 'meeting':
            entity = Meeting.objects.filter(id=entity_id, organization=user.organization).first()
            
        if not entity:
            return f"Erreur : {entity_type} avec l'ID {entity_id} introuvable."
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_note = f"\n\n[{timestamp}] {note_content}"
        
        if entity.notes:
            entity.notes += new_note
        else:
            entity.notes = f"[{timestamp}] {note_content}"
            
        entity.save()
        
        return {
            "message": "Note ajoutée avec succès.",
            "action": {
                "type": "NAVIGATE",
                "label": f"Voir {entity_type.capitalize()}",
                "url": f"/crm/{entity_type if entity_type != 'company' else 'companies'}/{entity_id}" if entity_type != 'contract' else f"/crm/contracts/{entity_id}"
            }
        }
    @staticmethod
    def update_company(name, industry=None, size=None, website=None, notes=None, user=None):
        """Updates an existing company."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        company = Company.objects.filter(name__icontains=name, organization=user.organization).first()
        if not company:
            return f"Erreur : Entreprise '{name}' introuvable."
            
        changes = []
        if industry is not None:
            company.industry = industry
            changes.append(f"secteur ({industry})")
        if size is not None:
            company.size = size
            changes.append(f"taille ({size})")
        if website is not None:
            company.website = website
            changes.append(f"site web ({website})")
        if notes is not None:
            company.notes = notes
            changes.append("notes")
            
        company.save()
        
        if not changes:
            return f"Aucune modification demandée pour '{name}'."
            
        return f"Entreprise '{company.name}' mise à jour : {', '.join(changes)}."

    @staticmethod
    def update_contact(name, email=None, position=None, phone=None, user=None):
        """Updates an existing contact by name."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        # Simplistic name search (last word is last name?)
        # Let's search by string container
        from django.db.models import Q
        contact = Contact.objects.filter(
            Q(first_name__icontains=name) | Q(last_name__icontains=name) | Q(email__icontains=name),
            organization=user.organization
        ).first()
        
        if not contact:
            return f"Erreur : Contact '{name}' introuvable."
            
        changes = []
        if email is not None:
            contact.email = email
            changes.append(f"email ({email})")
        if position is not None:
            contact.position = position
            changes.append(f"poste ({position})")
        if phone is not None:
            contact.phone = phone
            changes.append(f"téléphone ({phone})")
            
        contact.save()
        
        if not changes:
            return f"Aucune modification demandée pour '{contact.first_name} {contact.last_name}'."
            
        return f"Contact '{contact.first_name} {contact.last_name}' mis à jour : {', '.join(changes)}."
        
    @staticmethod
    def get_company_details(name, user=None):
        """Gets full details of a company."""
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."
            
        company = Company.objects.filter(name__icontains=name, organization=user.organization).first()
        if not company:
             return f"Erreur : Entreprise '{name}' introuvable."
             
        # Build text summary
        details = f"Détails de {company.name}:\n"
        details += f"- Secteur: {company.industry}\n"
        details += f"- Taille: {company.size}\n"
        details += f"- Site: {company.website}\n"
        details += f"- Adresse: {company.address}\n"
        details += f"- Notes: {company.notes}\n"
        
        # Related counts
        contact_count = company.contacts.count()
        meeting_count = company.meetings.count()
        contract_count = company.contracts.count()
        
        details += f"\nRelations:\n- {contact_count} contacts\n- {meeting_count} réunions\n- {contract_count} contrats"
        
        return details
