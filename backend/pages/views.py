from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Page
from .serializers import PageSerializer, PageTreeSerializer

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer

    @action(detail=False, methods=['get'])
    def tree(self, request):
        # Get root pages (no parent)
        root_pages = Page.objects.filter(parent__isnull=True).order_by('title')
        serializer = PageTreeSerializer(root_pages, many=True)
        return Response(serializer.data)
