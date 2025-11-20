from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/', include('pages.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('databases.urls')),
]
