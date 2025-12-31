from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet, ContactViewSet, ContractViewSet, MeetingViewSet, DocumentViewSet, MeetingTemplateViewSet, SharedLinkViewSet, ContractTemplateViewSet
from .api_public import PublicSharedLinkView, PublicTaskViewSet, PublicMeetingViewSet, PublicDocumentViewSet, PublicMeetingTemplateViewSet

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'contacts', ContactViewSet)
router.register(r'contracts', ContractViewSet)
router.register(r'contract-templates', ContractTemplateViewSet)
router.register(r'meetings', MeetingViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'meeting-templates', MeetingTemplateViewSet)
router.register(r'shared-links', SharedLinkViewSet)


public_router = DefaultRouter()
public_router.register(r'tasks', PublicTaskViewSet, basename='public-tasks')
public_router.register(r'meetings', PublicMeetingViewSet, basename='public-meetings')
public_router.register(r'documents', PublicDocumentViewSet, basename='public-documents')
public_router.register(r'meeting-templates', PublicMeetingTemplateViewSet, basename='public-meeting-templates')

urlpatterns = [
    path('', include(router.urls)),
    path('public/config/', PublicSharedLinkView.as_view(), name='public-config'),
    path('public/', include(public_router.urls)),
]
