from django.contrib import admin
from django.utils.html import mark_safe
from .models import Adventure
from worldtravel.models import Country, Region, VisitedRegion


class AdventureAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'user_id', 'date', 'image_display')
    list_filter = ('type', 'user_id')

    def image_display(self, obj):
        if obj.image:
            return mark_safe(f'<img src="{obj.image.url}" width="100px" height="100px"')
        else:
            return

    image_display.short_description = 'Image Preview'


class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'country_code', 'continent', 'number_of_regions')
    list_filter = ('continent', 'country_code')

    def number_of_regions(self, obj):
        return Region.objects.filter(country=obj).count()

    number_of_regions.short_description = 'Number of Regions'


class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'number_of_visits')
    # list_filter = ('country', 'number_of_visits')

    def number_of_visits(self, obj):
        return VisitedRegion.objects.filter(region=obj).count()
    
    number_of_visits.short_description = 'Number of Visits'

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'is_staff', 'is_active', 'image_display']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('profile_pic',)}),
    )
    def image_display(self, obj):
        if obj.profile_pic:
            return mark_safe(f'<img src="{obj.profile_pic.url}" width="100px" height="100px"')
        else:
            return

admin.site.register(CustomUser, CustomUserAdmin)



admin.site.register(Adventure, AdventureAdmin)
admin.site.register(Country, CountryAdmin)
admin.site.register(Region, RegionAdmin)
admin.site.register(VisitedRegion)

admin.site.site_header = 'AdventureLog Admin'
admin.site.site_title = 'AdventureLog Admin Site'
admin.site.index_title = 'Welcome to AdventureLog Admin Page'
