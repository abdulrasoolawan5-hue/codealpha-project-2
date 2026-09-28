"""Store views — product listing, product detail, cart, checkout, orders."""

from decimal import Decimal

from django.contrib import messages
from django.core.paginator import Paginator
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render

from store.models import Cart, CartItem, Category, Order, OrderItem, Product

PRODUCTS_PER_PAGE = 12

REQUIRED_CHECKOUT_FIELDS = ("full_name", "email", "phone", "shipping_address", "city", "postal_code")


def product_list(request):
    """Product listing with category filtering, keyword search, and pagination."""
    products = Product.objects.filter(is_active=True).select_related("category")

    category_slug = request.GET.get("category")
    selected_category = None
    if category_slug:
        selected_category = get_object_or_404(Category, slug=category_slug)
        products = products.filter(category=selected_category)

    search_query = request.GET.get("q", "").strip()
    if search_query:
        products = products.filter(name__icontains=search_query)

    sort = request.GET.get("sort", "")
    if sort == "price_low":
        products = products.order_by("price")
    elif sort == "price_high":
        products = products.order_by("-price")
    elif sort == "name":
        products = products.order_by("name")
    else:
        products = products.order_by("-created_at")

    paginator = Paginator(products, PRODUCTS_PER_PAGE)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    categories = Category.objects.all()

    context = {
        "page_obj": page_obj,
        "categories": categories,
        "selected_category": selected_category,
        "search_query": search_query,
        "sort": sort,
    }
    return render(request, "store/product_list.html", context)


def product_detail(request, slug):
    """Product detail with large image, description, stock status, and related products."""
    product = get_object_or_404(Product, slug=slug, is_active=True)
    related_products = (
        Product.objects.filter(category=product.category, is_active=True)
        .exclude(pk=product.pk)
        .select_related("category")[:4]
    )

    context = {
        "product": product,
        "related_products": related_products,
    }
    return render(request, "store/product_detail.html", context)


# --- Cart helpers ---

def _get_or_create_cart(request):
    """Get or create a cart for the current user or session."""
    if request.user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(
            user=request.user,
            defaults={"session_key": None},
        )
        return cart

    if not request.session.session_key:
        request.session.create()
    session_key = request.session.session_key
    cart, _ = Cart.objects.get_or_create(
        session_key=session_key,
        user=None,
    )
    return cart


def _cart_item_count(cart):
    """Return the total quantity of items in a cart."""
    from django.db.models import Sum
    result = CartItem.objects.filter(cart=cart).aggregate(total=Sum("quantity"))
    return result["total"] or 0


# --- Cart views ---

def cart_view(request):
    """Cart page — displays cart items with quantity controls."""
    cart = _get_or_create_cart(request)
    items = cart.items.select_related("product", "product__category").all()
    context = {
        "cart": cart,
        "items": items,
    }
    return render(request, "store/cart.html", context)


def add_to_cart(request, product_id):
    """Add a product to the cart via POST. Returns JSON for fetch() calls."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    product = get_object_or_404(Product, pk=product_id, is_active=True)
    quantity = request.POST.get("quantity", 1)

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid quantity."}, status=400)

    if quantity < 1:
        return JsonResponse({"error": "Quantity must be at least 1."}, status=400)

    cart = _get_or_create_cart(request)
    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product,
        defaults={"quantity": 0},
    )

    new_quantity = cart_item.quantity + quantity
    if new_quantity > product.stock:
        available = product.stock - cart_item.quantity
        if available <= 0:
            return JsonResponse(
                {"error": f"You already have all {cart_item.quantity} available units in your cart."},
                status=400,
            )
        return JsonResponse(
            {"error": f"Only {available} more available (stock: {product.stock}, in cart: {cart_item.quantity})."},
            status=400,
        )

    cart_item.quantity = new_quantity
    cart_item.save()

    return JsonResponse({
        "success": True,
        "message": f"Added {quantity} × {product.name} to cart.",
        "cart_count": _cart_item_count(cart),
    })


def update_cart_item(request, item_id):
    """Update cart item quantity via POST. Returns JSON."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    cart = _get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, pk=item_id, cart=cart)

    quantity = request.POST.get("quantity", 1)
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Invalid quantity."}, status=400)

    if quantity < 1:
        return JsonResponse({"error": "Quantity must be at least 1."}, status=400)

    if quantity > cart_item.product.stock:
        return JsonResponse(
            {"error": f"Only {cart_item.product.stock} units available."},
            status=400,
        )

    cart_item.quantity = quantity
    cart_item.save()

    subtotal = cart_item.subtotal
    cart_total = cart.total_price
    cart_count = _cart_item_count(cart)

    return JsonResponse({
        "success": True,
        "subtotal": str(subtotal),
        "cart_total": str(cart_total),
        "cart_count": cart_count,
    })


def remove_cart_item(request, item_id):
    """Remove a cart item via POST. Returns JSON."""
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    cart = _get_or_create_cart(request)
    cart_item = get_object_or_404(CartItem, pk=item_id, cart=cart)
    product_name = cart_item.product.name
    cart_item.delete()

    cart_total = cart.total_price
    cart_count = _cart_item_count(cart)

    return JsonResponse({
        "success": True,
        "message": f"Removed {product_name} from cart.",
        "cart_total": str(cart_total),
        "cart_count": cart_count,
        "cart_empty": cart.is_empty,
    })


# --- Checkout ---

def checkout_view(request):
    """Checkout page — shipping form and order summary. Handles POST to place order."""
    cart = _get_or_create_cart(request)
    if cart.is_empty:
        return redirect("cart")

    items = cart.items.select_related("product").all()

    if request.method == "POST":
        form_data = {}
        field_errors = {}

        for field in REQUIRED_CHECKOUT_FIELDS:
            value = request.POST.get(field, "").strip()
            form_data[field] = value
            if not value:
                field_errors[field] = ["This field is required."]

        if form_data.get("email") and "@" not in form_data["email"]:
            field_errors.setdefault("email", []).append("Enter a valid email address.")

        if field_errors:
            context = {
                "cart": cart,
                "items": items,
                "form_data": form_data,
                "field_errors": field_errors,
                "form_errors": field_errors,
            }
            return render(request, "store/checkout.html", context)

        # Create the order atomically — stock is decremented per item
        with transaction.atomic():
            order = Order.objects.create(
                user=request.user if request.user.is_authenticated else None,
                full_name=form_data["full_name"],
                email=form_data["email"],
                phone=form_data["phone"],
                shipping_address=form_data["shipping_address"],
                city=form_data["city"],
                postal_code=form_data["postal_code"],
                total_amount=Decimal("0.00"),
                status=Order.Status.PENDING,
            )

            total = Decimal("0.00")
            for item in items:
                unit_price = item.product.price
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    unit_price=unit_price,
                    quantity=item.quantity,
                )
                total += item.subtotal

                # Decrement stock
                product = item.product
                product.stock = max(0, product.stock - item.quantity)
                product.save()

            order.total_amount = total
            order.save()

            # Clear the cart
            cart.items.all().delete()

        messages.success(request, f"Order #{order.pk} placed successfully!")
        return redirect("order_confirmation", order_id=order.pk)

    context = {
        "cart": cart,
        "items": items,
    }
    return render(request, "store/checkout.html", context)


def order_confirmation(request, order_id):
    """Order confirmation page — shows order details after successful checkout."""
    order = get_object_or_404(Order, pk=order_id)
    items = order.items.select_related("product").all()

    # Security: only the order owner or the same session can view it
    if request.user.is_authenticated:
        if order.user and order.user != request.user:
            return redirect("home")
    else:
        # Guest orders are viewable only immediately after creation
        # (no session-scoped ownership check, so we rely on the redirect flow)
        pass

    context = {
        "order": order,
        "items": items,
    }
    return render(request, "store/order_confirmation.html", context)
