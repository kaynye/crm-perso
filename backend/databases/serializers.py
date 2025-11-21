from rest_framework import serializers
from .models import Database, Property, PropertyValue
from pages.models import Page

class PropertySerializer(serializers.ModelSerializer):
    database = serializers.ReadOnlyField(source='database.id')

    class Meta:
        model = Property
        fields = '__all__'

class PropertyValueSerializer(serializers.ModelSerializer):
    property_name = serializers.ReadOnlyField(source='property.name')
    property_type = serializers.ReadOnlyField(source='property.type')

    class Meta:
        model = PropertyValue
        fields = '__all__'

class DatabaseSerializer(serializers.ModelSerializer):
    properties = PropertySerializer(many=True, read_only=True)

    class Meta:
        model = Database
        fields = '__all__'

class RowSerializer(serializers.ModelSerializer):
    values = PropertyValueSerializer(source='property_values', many=True, read_only=True)

    class Meta:
        model = Page
        fields = ['id', 'title', 'values', 'created_at', 'updated_at']
