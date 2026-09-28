"""Accounts views — login, register, logout, order history."""

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render

from store.models import Order


def login_view(request):
    """Login page with email/password form."""
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        if not username or not password:
            messages.error(request, "Please enter both username and password.")
            return render(request, "accounts/login.html")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.username}!")
            next_url = request.GET.get("next") or request.POST.get("next") or "/"
            return redirect(next_url)
        else:
            messages.error(request, "Invalid username or password.")

    return render(request, "accounts/login.html")


def register_view(request):
    """Registration page with username, email, and password."""
    if request.user.is_authenticated:
        return redirect("home")

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password1 = request.POST.get("password1", "")
        password2 = request.POST.get("password2", "")

        errors = []

        if not username:
            errors.append("Username is required.")
        elif len(username) < 3:
            errors.append("Username must be at least 3 characters long.")

        if not email:
            errors.append("Email is required.")
        elif "@" not in email:
            errors.append("Please enter a valid email address.")

        if not password1:
            errors.append("Password is required.")
        elif len(password1) < 8:
            errors.append("Password must be at least 8 characters long.")

        if password1 != password2:
            errors.append("Passwords do not match.")

        from django.contrib.auth.models import User
        if username and User.objects.filter(username=username).exists():
            errors.append("This username is already taken.")
        if email and User.objects.filter(email=email).exists():
            errors.append("An account with this email already exists.")

        if errors:
            for err in errors:
                messages.error(request, err)
            return render(request, "accounts/register.html", {
                "form_data": {"username": username, "email": email},
            })

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1,
        )
        login(request, user)
        messages.success(request, f"Account created. Welcome, {user.username}!")
        return redirect("home")

    return render(request, "accounts/register.html")


def logout_view(request):
    """Logout via POST."""
    if request.method == "POST":
        logout(request)
        messages.success(request, "You have been logged out.")
    return redirect("home")


@login_required
def order_history(request):
    """Order history page for the logged-in user."""
    orders = (
        Order.objects.filter(user=request.user)
        .prefetch_related("items__product")
        .order_by("-created_at")
    )
    return render(request, "accounts/order_history.html", {"orders": orders})
