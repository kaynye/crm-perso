import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from crm.models import ContractTemplate, Contract
from core.models import Organization

def create_template():
    # Professional Contract Content in EditorJS format
    # Using French as per user language
    content = {
        "time": 1704067200000,
        "blocks": [
            {
                "id": "header-1",
                "type": "header",
                "data": {
                    "text": "CONTRAT DE PRESTATION DE SERVICES",
                    "level": 1
                }
            },
            {
                "id": "intro-1",
                "type": "paragraph",
                "data": {
                    "text": "<b>ENTRE LES SOUSSIGNÉS :</b>"
                }
            },
            {
                "id": "party-1",
                "type": "paragraph",
                "data": {
                    "text": "<b>{{org_name}}</b>, ci-après dénommé le « <b>Prestataire</b> »,"
                }
            },
            {
                "id": "party-2",
                "type": "paragraph",
                "data": {
                    "text": "<b>ET</b>"
                }
            },
            {
                "id": "party-3",
                "type": "paragraph",
                "data": {
                    "text": "<b>{{client_name}}</b>, ci-après dénommé le « <b>Client</b> »,"
                }
            },
            {
                "id": "clause-1",
                "type": "header",
                "data": {
                    "text": "ARTICLE 1 - OBJET DU CONTRAT",
                    "level": 3
                }
            },
            {
                "id": "text-1",
                "type": "paragraph",
                "data": {
                    "text": "Le présent contrat a pour objet de définir les conditions dans lesquelles le Prestataire s'engage à fournir au Client les services suivants : {{title}}."
                }
            },
            {
                "id": "clause-2",
                "type": "header",
                "data": {
                    "text": "ARTICLE 2 - DURÉE",
                    "level": 3
                }
            },
            {
                "id": "text-2",
                "type": "paragraph",
                "data": {
                    "text": "Le présent contrat prend effet à compter du <b>{{start_date}}</b> et se terminera le <b>{{end_date}}</b>."
                }
            },
            {
                "id": "clause-3",
                "type": "header",
                "data": {
                    "text": "ARTICLE 3 - MODALITÉS FINANCIÈRES",
                    "level": 3
                }
            },
            {
                "id": "text-3",
                "type": "paragraph",
                "data": {
                    "text": "En contrepartie de la réalisation des prestations définies à l'article 1, le Client s'engage à verser au Prestataire la somme globale de <b>{{amount}} € HT</b>."
                }
            },
            {
                "id": "clause-4",
                "type": "header",
                "data": {
                    "text": "ARTICLE 4 - OBLIGATIONS ET CONFIDENTIALITÉ",
                    "level": 3
                }
            },
            {
                "id": "text-4",
                "type": "paragraph",
                "data": {
                    "text": "Le Prestataire s'engage à mettre en œuvre tous les moyens nécessaires à la bonne exécution des prestations. Les parties s'engagent à conserver confidentielles toutes les informations échangées dans le cadre du présent contrat."
                }
            },
            {
                "id": "clause-5",
                "type": "header",
                "data": {
                    "text": "ARTICLE 5 - LITIGES",
                    "level": 3
                }
            },
            {
                "id": "text-5",
                "type": "paragraph",
                "data": {
                    "text": "Tout litige relatif à l'interprétation et à l'exécution du présent contrat est soumis au droit français."
                }
            },
            {
                "id": "sign-header",
                "type": "header",
                "data": {
                    "text": "SIGNATURES",
                    "level": 3
                }
            },
            {
                "id": "signatures",
                "type": "paragraph",
                "data": {
                    "text": "Fait à ____________________, le ____________________, en deux exemplaires."
                }
            },
            {
                "id": "sign-zones",
                "type": "paragraph",
                "data": {
                    "text": "<b>Pour le Prestataire :</b><br><br><br><br>____________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>Pour le Client :</b><br><br><br><br>____________________"
                }
            }
        ],
        "version": "2.29.0"
    }

    # Identify Organization (Just pick first one for simplicity or specific ID if known)
    # The user didn't specify org, assuming they want it for *their* org.
    # We will try to attach it to the organization of the specific Contract if it exists.
    
    target_contract_id = '0ab85856-b9f2-4814-9f0f-030067ce84cd'
    
    try:
        contract = Contract.objects.get(id=target_contract_id)
        org = contract.organization
        print(f"Found Contract {contract.title} in Org: {org.name}")
        
        # 1. Create Template attached to this Org
        template, created = ContractTemplate.objects.get_or_create(
            name="Modèle Professionnel (Prestation de Service)",
            organization=org,
            defaults={"content": content}
        )
        if not created:
            template.content = content
            template.save()
            print("Updated existing template.")
        else:
            print("Created new template.")
            
        # 2. Update the Contract Content
        contract.content = content
        contract.save()
        print(f"✅ Successfully updated Contract {contract.id} with professional template.")
        
    except Contract.DoesNotExist:
        print(f"❌ Contract {target_contract_id} not found.")
        # Fallback: Create template for first org found
        org = Organization.objects.first()
        if org:
             template, created = ContractTemplate.objects.get_or_create(
                name="Modèle Professionnel (Prestation de Service)",
                organization=org,
                defaults={"content": content}
            )
             print(f"Created template for Organization: {org.name} (Contract not found)")

if __name__ == '__main__':
    create_template()
