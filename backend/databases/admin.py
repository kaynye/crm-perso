from django.contrib import admin
from .models import Database, Property, PropertyValue

admin.site.register(Database)
admin.site.register(Property)
admin.site.register(PropertyValue)
# Register your models here.
