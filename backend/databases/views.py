from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Database, Property, PropertyValue
from pages.models import Page
from .serializers import DatabaseSerializer, PropertySerializer, RowSerializer, PropertyValueSerializer

class DatabaseViewSet(viewsets.ModelViewSet):
    queryset = Database.objects.all()
    serializer_class = DatabaseSerializer

    @action(detail=True, methods=['get', 'post'])
    def rows(self, request, pk=None):
        database = self.get_object()
        
        if request.method == 'GET':
            rows = Page.objects.filter(database=database)
            serializer = RowSerializer(rows, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create a new Page as a row
            title = request.data.get('title', 'Untitled')
            page = Page.objects.create(
                title=title,
                database=database,
                page_type='database_row',
                parent=database.parent_page # Optional: keep hierarchy
            )
            
            # Handle initial property values if provided
            values = request.data.get('values', {})
            for prop_id, value in values.items():
                try:
                    prop = Property.objects.get(id=prop_id, database=database)
                    PropertyValue.objects.create(page=page, property=prop, value=value)
                except Property.DoesNotExist:
                    pass
            
            return Response(RowSerializer(page).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def properties(self, request, pk=None):
        database = self.get_object()
        serializer = PropertySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(database=database)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PropertyValueViewSet(viewsets.ModelViewSet):
    queryset = PropertyValue.objects.all()
    serializer_class = PropertyValueSerializer
