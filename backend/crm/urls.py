from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, ContactViewSet, ContractViewSet, MeetingViewSet, DocumentViewSet, MeetingTemplateViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'meeting-templates', MeetingTemplateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
