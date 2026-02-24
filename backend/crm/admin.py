from django.contrib import admin
from .models import Space, Contact, Contract, Meeting, Document, MeetingTemplate, SharedLink
# Register your models here.
admin.site.register(Space)
admin.site.register(Contact)
admin.site.register(Contract)
admin.site.register(Meeting)
admin.site.register(Document)
admin.site.register(MeetingTemplate)
admin.site.register(SharedLink)