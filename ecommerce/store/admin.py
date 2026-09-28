"""Admin configuration for the store app."""

from django.contrib import admin

from store.models import Cart, CartItem, Category, Order, OrderItem, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "product_count")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "stock", "is_active", "created_at")
    list_filter = ("category", "is_active", "created_at")
    search_fields = ("name", "description")
    prepopulated_fields = {"slug": ("name",)}
    list_editable = ("price", "stock", "is_active")
    date_hierarchy = "created_at"
    raw_id_fields = ("category",)


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "session_key", "total_quantity", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "session_key")
    inlines = [CartItemInline]
    readonly_fields = ("created_at",)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("unit_price", "quantity", "product", "subtotal")

    @admin.display(description="Subtotal")
    def subtotal(self, obj):
        return obj.subtotal


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "email", "total_amount", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("full_name", "email", "phone", "city")
    list_editable = ("status",)
    date_hierarchy = "created_at"
    inlines = [OrderItemInline]
    readonly_fields = ("total_amount", "created_at")
    fieldsets = (
        ("Customer", {
            "fields": ("user", "full_name", "email", "phone"),
        }),
        ("Shipping", {
            "fields": ("shipping_address", "city", "postal_code"),
        }),
        ("Order details", {
            "fields": ("total_amount", "status", "created_at"),
        }),
    )
