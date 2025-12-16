from crm.models import Company, Contract, Meeting, Contact
from tasks.models import Task

class ContentTools:
    @staticmethod
    def draft_content(entity_type, entity_id, instruction, llm_service, user=None, rag_context=""):
        """
        Drafts content based on an entity and instructions.
        """
        if not user or not hasattr(user, 'organization'):
            return "Erreur: Impossible de déterminer l'organisation."

        entity = None
        data_str = ""
        
        if entity_type == 'company':
            entity = Company.objects.filter(id=entity_id, organization=user.organization).first()
            if entity:
                data_str = f"Company: {entity.name}\nIndustry: {entity.industry}\nNotes: {entity.notes}"
        elif entity_type == 'contract':
            entity = Contract.objects.filter(id=entity_id, organization=user.organization).first()
            if entity:
                data_str = f"Contract: {entity.title}\nCompany: {entity.company.name}\nStatus: {entity.status}\nAmount: {entity.amount}\nStart Date: {entity.start_date}\nEnd Date: {entity.end_date}"
        elif entity_type == 'contact':
            entity = Contact.objects.filter(id=entity_id, organization=user.organization).first()
            if entity:
                data_str = f"Contact: {entity.first_name} {entity.last_name}\nPosition: {entity.position}\nCompany: {entity.company.name if entity.company else 'N/A'}"
        
        if not entity:
            # If no entity, maybe they just want general drafting using RAG?
            pass

        # Generate content using LLM
        prompt = f"""
        You are a professional business assistant.
        
        ENTITY DATA:
        {data_str}
        
        ADDITIONAL CONTEXT (RAG):
        {rag_context}
        
        INSTRUCTION:
        {instruction}
        
        Draft the content as requested. Be professional and concise.
        """
        
        messages = [{'role': 'user', 'content': prompt}]
        response = llm_service.chat(messages, context="")
        
        return {
            "message": "Content generated successfully.",
            "content": response, # The generated text
            "action": {
                "type": "COPY", # Frontend could implement this
                "label": "Copy to Clipboard",
                "text": response
            }
        }
