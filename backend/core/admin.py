from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Organization

# Register your models here.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('organization',)
    fieldsets = UserAdmin.fieldsets + (
        ('Organization Info', {'fields': ('organization',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Organization Info', {'fields': ('organization',)}),
    )

admin.site.register(Organization)

