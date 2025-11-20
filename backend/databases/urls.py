from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatabaseViewSet, PropertyValueViewSet

router = DefaultRouter()
router.register(r'databases', DatabaseViewSet)
router.register(r'values', PropertyValueViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
