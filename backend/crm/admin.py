from django.contrib import admin
from .models import Company, Contact, Contract, Meeting
# Register your models here.
admin.site.register(Company)
admin.site.register(Contact)
admin.site.register(Contract)
admin.site.register(Meeting)