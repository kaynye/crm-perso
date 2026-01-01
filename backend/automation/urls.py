from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AutomationRuleViewSet, AutomationLogViewSet

router = DefaultRouter()
router.register(r'rules', AutomationRuleViewSet, basename='automationrule')
router.register(r'logs', AutomationLogViewSet, basename='automationlog')

urlpatterns = [
    path('', include(router.urls)),
]
