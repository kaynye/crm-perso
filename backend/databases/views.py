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
            
            # Filtering
            filter_param = request.query_params.get('filter')
            if filter_param:
                import json
                try:
                    filters = json.loads(filter_param)
                    # filters example: {"property_id": "value"}
                    for prop_id, value in filters.items():
                        # This is a bit complex with EAV. We need to filter pages that have a PropertyValue 
                        # with this property and value.
                        rows = rows.filter(property_values__property_id=prop_id, property_values__value=value)
                except json.JSONDecodeError:
                    pass

            serializer = RowSerializer(rows, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create a new Page as a row
            title = request.data.get('title', 'Untitled')
            page = Page.objects.create(
                title=title,
                database=database,
                page_type='database_row',
                parent=database.page # Optional: keep hierarchy
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

    @action(detail=True, methods=['get'])
    def kanban(self, request, pk=None):
        database = self.get_object()
        group_by_id = request.query_params.get('group_by')

        if not group_by_id:
            return Response({'error': 'group_by parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group_property = Property.objects.get(id=group_by_id, database=database)
        except Property.DoesNotExist:
            return Response({'error': 'Property not found'}, status=status.HTTP_404_NOT_FOUND)

        if group_property.type != 'select':
            return Response({'error': 'Group by property must be of type "select"'}, status=status.HTTP_400_BAD_REQUEST)

        # Get all rows
        rows = Page.objects.filter(database=database)
        
        # Get options from config
        options = group_property.config.get('options', [])
        
        # Initialize groups
        grouped_data = {opt: [] for opt in options}
        grouped_data['No Status'] = []

        # Fetch rows with their values
        # This is N+1 query prone, but for MVP it's fine. 
        # Optimally we'd prefetch property_values.
        for row in rows:
            row_data = RowSerializer(row).data
            
            # Find value for group_property
            val_obj = row.property_values.filter(property=group_property).first()
            val = val_obj.value if val_obj else None

            if val and val in grouped_data:
                grouped_data[val].append(row_data)
            else:
                grouped_data['No Status'].append(row_data)

        return Response(grouped_data)

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
