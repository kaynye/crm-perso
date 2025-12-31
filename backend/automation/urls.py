from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AutomationRuleViewSet

router = DefaultRouter()
router.register(r'rules', AutomationRuleViewSet, basename='automationrule')

urlpatterns = [
    path('', include(router.urls)),
]
