from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.ReadOnlyField(source='organization.name')
    has_github = serializers.SerializerMethodField()
    has_google_calendar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'is_admin', 'organization', 'organization_name', 'has_github', 'has_google_calendar')

    def get_has_github(self, obj):
        try:
            return bool(obj.integration.github_access_token)
        except:
            return False

    def get_has_google_calendar(self, obj):
        try:
            return bool(obj.integration.google_access_token)
        except:
            return False

from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('id', 'type', 'title', 'message', 'link', 'is_read', 'created_at', 'actor', 'actor_name')
        
    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return "Système"

from .models import UserFcmToken

class UserFcmTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFcmToken
        fields = ('token', 'device_type')
