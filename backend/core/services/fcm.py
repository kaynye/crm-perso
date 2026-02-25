import firebase_admin
from firebase_admin import credentials, messaging
import os
from django.conf import settings

# Initialize Firebase app only once
if not firebase_admin._apps:
    try:
        cred_path = os.path.join(settings.BASE_DIR, 'config', 'crm-perso.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Failed to initialize Firebase Admin: {e}")

def send_push_notification(user, title, body, data=None):
    """
    Send push notification to all fcm tokens of a given user.
    """
    if data is None:
        data = {}
        
    tokens = list(user.fcm_tokens.values_list('token', flat=True))
    if not tokens:
        return 0
        
    message = messaging.MulticastMessage(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data,
        tokens=tokens,
    )
    
    try:
        response = messaging.send_multicast(message)
        # Handle failed tokens (e.g., app uninstalled)
        if response.failure_count > 0:
            responses = response.responses
            failed_tokens = []
            for idx, resp in enumerate(responses):
                if not resp.success:
                    # Clean up unregistered tokens
                    if resp.exception and hasattr(resp.exception, 'code') and resp.exception.code == 'messaging/registration-token-not-registered':
                         failed_tokens.append(tokens[idx])
            
            if failed_tokens:
                user.fcm_tokens.filter(token__in=failed_tokens).delete()
                
        return response.success_count
    except Exception as e:
        print(f"Error sending FCM notification: {e}")
        return 0
