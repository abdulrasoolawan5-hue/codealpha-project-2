"""Store URL configuration."""

from django.urls import path
from store import views

urlpatterns = [
    path("", views.product_list, name="home"),
    path("product/<slug:slug>/", views.product_detail, name="product_detail"),
    path("cart/", views.cart_view, name="cart"),
    path("cart/add/<int:product_id>/", views.add_to_cart, name="add_to_cart"),
    path("cart/update/<int:item_id>/", views.update_cart_item, name="update_cart_item"),
    path("cart/remove/<int:item_id>/", views.remove_cart_item, name="remove_cart_item"),
    path("checkout/", views.checkout_view, name="checkout"),
    path("order/<int:order_id>/", views.order_confirmation, name="order_confirmation"),
]
