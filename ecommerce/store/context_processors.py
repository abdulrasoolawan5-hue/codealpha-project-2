"""Context processors available to all templates."""

from django.db.models import Sum

from store.models import Cart, CartItem


def cart_count(request):
    """Make the cart item count available in every template (header badge)."""
    count = 0
    cart = _get_cart(request)
    if cart:
        result = CartItem.objects.filter(cart=cart).aggregate(total=Sum("quantity"))
        count = result["total"] or 0
    return {"cart_count": count}


def _get_cart(request):
    if request.user.is_authenticated:
        return Cart.objects.filter(user=request.user).first()
    session_key = request.session.session_key
    if session_key:
        return Cart.objects.filter(session_key=session_key).first()
    return None
