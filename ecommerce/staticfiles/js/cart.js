/* cart.js — cart interactions via fetch() */

document.addEventListener("DOMContentLoaded", () => {
    initAddToCartForms();
    initCartQuantityControls();
    initRemoveButtons();
    initProductDetailQuantityControls();
    initMenuToggle();
});

/* Mobile menu toggle */
function initMenuToggle() {
    var toggle = document.querySelector(".menu-toggle");
    var nav = document.getElementById("nav-menu");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
}

/* Update cart badge in header */
function updateCartBadge(count) {
    var badge = document.getElementById("cart-badge");
    if (badge) {
        badge.textContent = count;
        badge.setAttribute("data-count", count);
        if (count > 0) {
            badge.style.display = "";
        } else {
            badge.style.display = "none";
        }
    }
}

/* Show a temporary message near the triggered element */
function showInlineMessage(element, message, isError) {
    var existing = element.parentElement.querySelector(".inline-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.className = "inline-toast " + (isError ? "inline-toast-error" : "inline-toast-success");
    toast.textContent = message;
    toast.setAttribute("role", isError ? "alert" : "status");

    element.parentElement.appendChild(toast);
    setTimeout(function () {
        toast.remove();
    }, 3500);
}

/* Add-to-cart forms (product listing + detail) */
function initAddToCartForms() {
    var forms = document.querySelectorAll(".add-to-cart-form");
    forms.forEach(function (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var formData = new FormData(form);
            var actionUrl = form.getAttribute("action");

            fetch(actionUrl, {
                method: "POST",
                body: formData,
                headers: { "X-CSRFToken": getCsrfToken() }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) {
                        showInlineMessage(form, data.error, true);
                    } else if (data.success) {
                        showInlineMessage(form, data.message || "Added to cart.", false);
                        updateCartBadge(data.cart_count);
                    }
                })
                .catch(function () {
                    showInlineMessage(form, "Something went wrong. Please try again.", true);
                });
        });
    });
}

/* Product detail quantity +/- buttons */
function initProductDetailQuantityControls() {
    var detailForm = document.querySelector(".product-detail-form");
    if (!detailForm) return;

    var qtyInput = detailForm.querySelector("#quantity");
    if (!qtyInput) return;

    detailForm.querySelectorAll(".qty-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var action = btn.getAttribute("data-action");
            var current = parseInt(qtyInput.value, 10) || 1;
            var maxVal = parseInt(qtyInput.getAttribute("max"), 10) || 999;

            if (action === "increase" && current < maxVal) {
                qtyInput.value = current + 1;
            } else if (action === "decrease" && current > 1) {
                qtyInput.value = current - 1;
            }
        });
    });
}

/* Cart page quantity update via fetch */
function initCartQuantityControls() {
    document.querySelectorAll(".qty-update").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var itemId = btn.getAttribute("data-item-id");
            var maxVal = parseInt(btn.getAttribute("data-max"), 10) || 999;
            var input = document.querySelector('.qty-input-field[data-item-id="' + itemId + '"]');
            if (!input) return;

            var current = parseInt(input.value, 10) || 1;
            var action = btn.getAttribute("data-action");

            if (action === "increase" && current < maxVal) {
                input.value = current + 1;
            } else if (action === "decrease" && current > 1) {
                input.value = current - 1;
            }

            updateCartItem(itemId, parseInt(input.value, 10));
        });
    });

    document.querySelectorAll(".qty-input-field").forEach(function (input) {
        input.addEventListener("change", function () {
            var itemId = input.getAttribute("data-item-id");
            var qty = parseInt(input.value, 10) || 1;
            if (qty < 1) qty = 1;
            input.value = qty;
            updateCartItem(itemId, qty);
        });
    });
}

function updateCartItem(itemId, quantity) {
    var formData = new FormData();
    formData.append("quantity", quantity);

    fetch("/cart/update/" + itemId + "/", {
        method: "POST",
        body: formData,
        headers: { "X-CSRFToken": getCsrfToken() }
    })
        .then(function (response) { return response.json(); })
        .then(function (data) {
            if (data.error) {
                alert(data.error);
            } else if (data.success) {
                var subtotalEl = document.querySelector('.subtotal-display[data-item-id="' + itemId + '"]');
                if (subtotalEl) subtotalEl.textContent = data.subtotal;

                var totalEl = document.getElementById("cart-total-display");
                if (totalEl) totalEl.textContent = data.cart_total;

                var itemCountEl = document.getElementById("summary-item-count");
                if (itemCountEl) itemCountEl.textContent = data.cart_count;

                updateCartBadge(data.cart_count);
            }
        })
        .catch(function () {
            alert("Something went wrong. Please try again.");
        });
}

/* Cart page remove via fetch */
function initRemoveButtons() {
    document.querySelectorAll(".remove-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var itemId = btn.getAttribute("data-item-id");
            var row = document.querySelector('.cart-row[data-item-id="' + itemId + '"]');
            if (!row) return;

            fetch("/cart/remove/" + itemId + "/", {
                method: "POST",
                headers: { "X-CSRFToken": getCsrfToken() }
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    if (data.error) {
                        alert(data.error);
                    } else if (data.success) {
                        row.remove();
                        updateCartBadge(data.cart_count);

                        var totalEl = document.getElementById("cart-total-display");
                        if (totalEl) totalEl.textContent = data.cart_total;

                        var itemCountEl = document.getElementById("summary-item-count");
                        if (itemCountEl) itemCountEl.textContent = data.cart_count;

                        if (data.cart_empty) {
                            window.location.reload();
                        }
                    }
                })
                .catch(function () {
                    alert("Something went wrong. Please try again.");
                });
        });
    });
}

/* Helper: get CSRF token from cookie or meta tag */
function getCsrfToken() {
    var cookieValue = null;
    var name = "csrftoken";
    if (document.cookie && document.cookie !== "") {
        document.cookie.split(";").forEach(function (cookie) {
            cookie = cookie.trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            }
        });
    }
    return cookieValue;
}
