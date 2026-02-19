/**
 * Quote Cart Logic for Europull
 * Handles adding/removing items to a quote basket using localStorage.
 * Now includes Sidebar UI injection and management.
 */

var QuoteCart = (function ($) {
    "use strict";

    var STORAGE_KEY = 'europull_quote_cart';
    var cart = [];

    function init() {
        injectCartSidebar();
        loadCart();
        updateCartCount();
        bindEvents();
    }

    // Inject Sidebar HTML into the DOM
    function injectCartSidebar() {
        if ($('#cart-sidebar').length > 0) return;

        var sidebarHtml = `
            <div class="cart-overlay"></div>
            <div id="cart-sidebar">
                <div class="cart-header">
                    <h4>QUOTE BASKET</h4>
                    <span class="close-cart"><i class="icon-close"></i></span>
                </div>
                <div class="cart-items">
                    <!-- Items will be injected here -->
                    <div class="text-center" style="margin-top: 50px; color: #999;">Your quote basket is empty.</div>
                </div>
                <div class="cart-footer">
                    <a href="quote-cart.html" class="btn-view-cart">Request Quote</a>
                </div>
            </div>
        `;

        $('body').append(sidebarHtml);
    }

    function loadCart() {
        var stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                cart = JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing cart data", e);
                cart = [];
            }
        }
    }

    function saveCart() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
        updateCartCount();
        renderCartSidebar(); // Update sidebar whenever cart is saved
        renderCartPage();    // Update full cart page if we are on it
    }

    function addToCart(product) {
        // Check if item exists
        var existing = cart.find(function (item) { return item.id === product.id; });
        if (existing) {
            existing.qty += product.qty || 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                image: product.image,
                url: product.url,
                qty: product.qty || 1
            });
        }
        saveCart();
        openSidebar(); // Open sidebar instead of alert
    }

    function removeFromCart(id) {
        cart = cart.filter(function (item) { return item.id !== id; });
        saveCart();
    }

    function updateCartCount() {
        var count = cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
        $('.quote-basket-count').text(count);
    }

    function getCart() {
        return cart;
    }

    // New: Render the Sidebar Items
    function renderCartSidebar() {
        var $container = $('.cart-items');
        if ($container.length === 0) return;

        $container.empty();

        if (cart.length === 0) {
            $container.html('<div class="text-center" style="margin-top: 50px; color: #999;">Your quote basket is empty.</div>');
            return;
        }

        cart.forEach(function (item) {
            var html = `
                <div class="cart-item">
                    <a href="${item.url}"><img src="${item.image}" alt="${item.name}"></a>
                    <div class="cart-item-details">
                        <h5><a href="${item.url}">${item.name}</a></h5>
                        <div class="cart-item-qty">Qty: ${item.qty}</div>
                    </div>
                    <span class="remove-from-cart-btn" data-id="${item.id}" title="Remove"><i class="icon-close"></i></span>
                </div>
            `;
            $container.append(html);
        });
    }

    function updateQty(id, action) {
        var item = cart.find(function (i) { return i.id === id; });
        if (!item) return;

        if (action === 'increase') {
            item.qty++;
        } else if (action === 'decrease') {
            item.qty--;
            if (item.qty < 1) item.qty = 1;
        }
        saveCart();
    }

    function renderCartPage() {
        var $container = $('#quote-cart-body');
        if ($container.length === 0) return;

        $container.empty();

        if (cart.length === 0) {
            $container.html('<tr><td colspan="4" class="text-center">Your quote basket is empty.</td></tr>');
            return;
        }

        cart.forEach(function (item) {
            var html = `
                <tr>
                    <td class="text-left">
                        <div class="media">
                            <div class="media-left"> <a href="${item.url}"> <img class="media-object" src="${item.image}" alt="${item.name}" style="width: 100px;"> </a> </div>
                            <div class="media-body">
                                <h4 class="media-heading"><a href="${item.url}">${item.name}</a></h4>
                            </div>
                        </div>
                    </td>
                    <td class="text-center">
                        <div class="qty-control" style="display: flex; justify-content: center; align-items: center;">
                            <button class="btn btn-xs btn-default update-qty" data-id="${item.id}" data-action="decrease" style="margin-right: 5px; padding: 2px 8px;">-</button>
                            <input type="text" value="${item.qty}" readonly class="form-control" style="width: 50px; text-align: center; margin: 0; height: 30px; padding: 5px;">
                            <button class="btn btn-xs btn-default update-qty" data-id="${item.id}" data-action="increase" style="margin-left: 5px; padding: 2px 8px;">+</button>
                        </div>
                    </td>
                    <td class="text-center">
                        <a href="#" class="remove-item" data-id="${item.id}"><i class="icon-close"></i></a>
                    </td>
                </tr>
            `;
            $container.append(html);
        });

        // Update hidden form input with cart data
        $('#quote_items_data').val(JSON.stringify(cart));
    }

    function openSidebar() {
        renderCartSidebar();
        $('#cart-sidebar').addClass('active');
        $('.cart-overlay').addClass('active');
    }

    function closeSidebar() {
        $('#cart-sidebar').removeClass('active');
        $('.cart-overlay').removeClass('active');
    }

    function bindEvents() {
        // Remove item click (Sidebar)
        $(document).on('click', '.remove-from-cart-btn', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            removeFromCart(id);
        });

        // Remove item click (Full Page)
        $(document).on('click', '.remove-item', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            removeFromCart(id);
        });

        // Update Qty Click
        $(document).on('click', '.update-qty', function (e) {
            e.preventDefault();
            var id = $(this).data('id');
            var action = $(this).data('action');
            updateQty(id, action);
        });

        // Add to Quote Click (Global delegate)
        $(document).on('click', '.add-to-quote', function (e) {
            e.preventDefault();
            var $btn = $(this);
            var product = {
                id: $btn.attr('data-id'),
                name: $btn.attr('data-name'),
                image: $btn.attr('data-image'),
                url: $btn.attr('data-url'),
                qty: 1
            };
            addToCart(product);
        });

        // Open Sidebar via Navbar Icon
        $(document).on('click', '.user-basket', function (e) {
            e.preventDefault();
            openSidebar();
        });

        // Close Sidebar events
        $(document).on('click', '.close-cart, .cart-overlay', function () {
            closeSidebar();
        });
    }

    return {
        init: init,
        renderCartPage: renderCartPage,
        openSidebar: openSidebar,
        closeSidebar: closeSidebar
    };

})(jQuery);

$(document).ready(function () {
    QuoteCart.init();
    // If we are on the quote cart page, render it
    if ($('#quote-cart-body').length > 0) {
        QuoteCart.renderCartPage();
    }
});
