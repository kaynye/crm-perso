from rest_framework import viewsets, permissions
from django.db.models import Q
from core.permissions import HasGeminiSecret, SpaceRolePermission
from core.mixins import OrganizationScopeMixin

from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Space, Contact, Contract, Meeting, Document, MeetingTemplate, SharedLink, ContractTemplate, SpaceType, SpaceMember, ActivityLog
from .serializers import SpaceSerializer, ContactSerializer, ContractSerializer, MeetingSerializer, DocumentSerializer, MeetingTemplateSerializer, SharedLinkSerializer, ContractTemplateSerializer, SpaceTypeSerializer, SpaceMemberSerializer, ActivityLogSerializer

class ContractTemplateViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = ContractTemplate.objects.all()
    serializer_class = ContractTemplateSerializer
    permission_classes = [HasGeminiSecret]

class SpaceTypeViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = SpaceType.objects.all()
    serializer_class = SpaceTypeSerializer
    permission_classes = [HasGeminiSecret]

class SpaceMemberViewSet(viewsets.ModelViewSet):
    queryset = SpaceMember.objects.all()
    serializer_class = SpaceMemberSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['space', 'user']

    def perform_create(self, serializer):
        member = serializer.save()
        ActivityLog.objects.create(
            space=member.space,
            actor=self.request.user,
            action='created',
            entity_type='Membre',
            entity_name=f"{member.user.first_name} {member.user.last_name}".strip() or member.user.email
        )

    def perform_destroy(self, instance):
        ActivityLog.objects.create(
            space=instance.space,
            actor=self.request.user,
            action='deleted',
            entity_type='Membre',
            entity_name=f"{instance.user.first_name} {instance.user.last_name}".strip() or instance.user.email
        )
        super().perform_destroy(instance)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not hasattr(user, 'organization'):
            return SpaceMember.objects.none()
        return SpaceMember.objects.filter(space__organization=user.organization)

class SpaceViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['name', 'industry']

    def perform_create(self, serializer):
        # Create the space
        space = serializer.save(organization=self.request.user.organization)
        # Create the admin member link using the current user
        SpaceMember.objects.create(space=space, user=self.request.user, role='admin')

class ContactViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['space', 'email']

class ContractViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['space', 'status']

    def perform_create(self, serializer):
        contract = serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )
        if contract.space:
            ActivityLog.objects.create(
                space=contract.space,
                actor=self.request.user,
                action='created',
                entity_type='Contrat',
                entity_name=contract.title
            )

    def perform_update(self, serializer):
        old_contract = self.get_object()
        old_status = old_contract.status
        
        contract = serializer.save()
        
        details = {}
        if old_status != contract.status:
            details['status'] = {
                'old': old_status,
                'new': contract.status
            }
            
        if contract.space:
            ActivityLog.objects.create(
                space=contract.space,
                actor=self.request.user,
                action='updated',
                entity_type='Contrat',
                entity_name=contract.title,
                details=details
            )

    def perform_destroy(self, instance):
        if instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=self.request.user,
                action='deleted',
                entity_type='Contrat',
                entity_name=instance.title
            )
        super().perform_destroy(instance)

class MeetingViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Meeting.objects.all()
    serializer_class = MeetingSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = ['space', 'contract', 'date']

    def perform_create(self, serializer):
        # OrganizationScopeMixin handles organization
        # We also want to set created_by
        if not self.request.user.organization:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("User does not belong to an organization.")
            
        meeting = serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )
        if meeting.space:
            ActivityLog.objects.create(
                space=meeting.space,
                actor=self.request.user,
                action='created',
                entity_type='Réunion',
                entity_name=meeting.title
            )

    def perform_update(self, serializer):
        meeting = serializer.save()
        if meeting.space:
            ActivityLog.objects.create(
                space=meeting.space,
                actor=self.request.user,
                action='updated',
                entity_type='Réunion',
                entity_name=meeting.title
            )

    def perform_destroy(self, instance):
        if instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=self.request.user,
                action='deleted',
                entity_type='Réunion',
                entity_name=instance.title
            )
        super().perform_destroy(instance)

class DocumentViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['space', 'contract']

    def perform_create(self, serializer):
        document = serializer.save()
        if document.space:
            ActivityLog.objects.create(
                space=document.space,
                actor=self.request.user,
                action='created',
                entity_type='Document',
                entity_name=document.name
            )

    def perform_destroy(self, instance):
        if instance.space:
            ActivityLog.objects.create(
                space=instance.space,
                actor=self.request.user,
                action='deleted',
                entity_type='Document',
                entity_name=instance.name
            )
        super().perform_destroy(instance)

class MeetingTemplateViewSet(OrganizationScopeMixin, viewsets.ModelViewSet):
    queryset = MeetingTemplate.objects.all()
    serializer_class = MeetingTemplateSerializer
    permission_classes = [HasGeminiSecret]

class SharedLinkViewSet(viewsets.ModelViewSet):
    queryset = SharedLink.objects.all()
    serializer_class = SharedLinkSerializer
    permission_classes = [HasGeminiSecret]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['space', 'contract']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated or not hasattr(user, 'organization'):
            return SharedLink.objects.none()
            
        return SharedLink.objects.filter(
            Q(space__organization=user.organization) | 
            Q(contract__organization=user.organization) |
            Q(created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [HasGeminiSecret, SpaceRolePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['space']

    def get_queryset(self):
        user = self.request.user
        space_id = self.request.query_params.get('space')
        
        if not user.is_authenticated or not hasattr(user, 'organization') or not space_id:
            return ActivityLog.objects.none()
            
        # Ensure user is an admin of this space
        member = SpaceMember.objects.filter(space_id=space_id, user=user).first()
        if not member or member.role != 'admin':
            return ActivityLog.objects.none()
            
        return ActivityLog.objects.filter(space_id=space_id, space__organization=user.organization)

