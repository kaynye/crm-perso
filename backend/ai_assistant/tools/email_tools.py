from django.core.mail import send_mail
from django.conf import settings

class EmailTools:
    @staticmethod
    def send_email(to_email, subject, body):
        """
        Sends an email using Django's configured backend.
        """
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[to_email],
                fail_silently=False,
            )
            return {
                "content": f"✅ Email envoyé avec succès à {to_email} !\n\n**Objet** : {subject}\n**Contenu** : {body[:50]}...",
                "action": None
            }
        except Exception as e:
            return {
                "content": f"❌ Erreur lors de l'envoi de l'email : {str(e)}",
                "action": None
            }
