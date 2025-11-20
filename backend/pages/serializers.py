from rest_framework import serializers
from .models import Page

class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = '__all__'
        read_only_fields = ('path', 'created_at', 'updated_at')

class PageTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Page
        fields = ('id', 'title', 'page_type', 'children')

    def get_children(self, obj):
        children = obj.children.all().order_by('title')
        return PageTreeSerializer(children, many=True).data
