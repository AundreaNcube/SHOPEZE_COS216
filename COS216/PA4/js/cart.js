// cart.js
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    if (!window.userApiKey) {
        alert("Please log in to view your cart.");
        window.location.href = 'login.php';
        return;
    }

    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        setupCurrencyListener();
        fetchAndDisplayCartItems();
    }).catch(function(error) {
        console.error("Failed to fetch currency rates:", error);
        fetchAndDisplayCartItems(); // Proceed with ZAR as fallback
    });
});

var mainLoader = document.getElementById('loader-container');
var contentContainer = document.querySelector('.cart-container');

function showMainLoader() {
    if (mainLoader) mainLoader.style.display = 'flex';
    if (contentContainer) contentContainer.style.display = 'none';
}

function hideMainLoader() {
    if (mainLoader) mainLoader.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
}

function setupCurrencyListener() {
    var currencyDropdown = document.getElementById('currency-dropdown');
    if (currencyDropdown) {
        currencyDropdown.addEventListener('change', function() {
            var newCurrency = currencyDropdown.value;
            window.currencyConverter.setCurrentCurrency(newCurrency);
            updateAllPrices(newCurrency);
            updateCartTotals();
        });
    } else {
        console.warn("Currency dropdown not found");
    }
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/u22747363/api.php", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                if (data.status === "success") {
                    resolve(data.data || []);
                } else {
                    console.error("API Error:", data.message);
                    if (data.message === "Invalid API key") {
                        alert("Your session has expired. Please log in again.");
                        localStorage.removeItem("apikey");
                        window.location.href = 'login.php';
                    }
                    reject(new Error(data.message));
                }
            } else {
                console.error("Fetch Error:", xhr.statusText);
                if (xhr.status === 401) {
                    alert("Unauthorized access. Please log in again.");
                    localStorage.removeItem("apikey");
                    window.location.href = 'login.php';
                }
                reject(new Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            console.error("Fetch Error:", xhr.statusText);
            reject(new Error(xhr.statusText));
        };

        xhr.send(JSON.stringify(requestBody));
    });
}

function fetchAndDisplayCartItems() {
    var requestBody = {
        type: "Cart",
        apikey: window.userApiKey,
        action: "get"
    };

    makeApiCall(requestBody).then(function(cartItems) {
        displayCartItems(cartItems);
    }).catch(function(error) {
        console.error("Error fetching cart items:", error);
        displayCartItems([]);
    });
}

function displayCartItems(cartItems) {
    var cartTableBody = document.querySelector('.cart-table tbody');
    if (!cartTableBody) {
        console.error("Cart table body not found in the DOM");
        hideMainLoader();
        return;
    }

    cartTableBody.innerHTML = '';

    if (cartItems.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="6">No items in cart.</td></tr>';
        updateCartTotals();
        hideMainLoader();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var totalImages = cartItems.length;
    var loadedImages = 0;

    cartItems.forEach(function(item) {
        var row = document.createElement('tr');
        row.classList.add('Details');
        row.dataset.productId = item.id;

        var price = parseFloat(item.final_price) || 0;
        var priceConverted = window.currencyConverter.convertPrice(price, 'ZAR', selectedCurrency);
        var displayPrice = priceConverted !== null ? priceConverted.toFixed(2) + ' ' + selectedCurrency : "Price Not Available";
        var totalPrice = (priceConverted * item.quantity).toFixed(2) + ' ' + selectedCurrency;

        row.innerHTML = `
            <td>
                <img src="${item.image_url || 'default-image.jpg'}" alt="${sanitizeInput(item.title)}" class="product-image">
                <br><a href="view.php?id=${item.id}" class="more-info">More Information</a>
            </td>
            <td>${sanitizeInput(item.title || 'No Title')}</td>
            <td class="price" data-price="${price}" data-currency="ZAR">${displayPrice}</td>
            <td><input type="number" value="${item.quantity}" min="1" class="quantity"></td>
            <td class="total">${totalPrice}</td>
            <td><button class="remove-btn">Remove from Cart</button></td>
        `;

        cartTableBody.appendChild(row);

        var img = row.querySelector('.product-image');
        img.onload = function() {
            loadedImages++;
            if (loadedImages >= totalImages) hideMainLoader();
        };
        img.onerror = function() {
            img.src = 'default-image.jpg';
            loadedImages++;
            if (loadedImages >= totalImages) hideMainLoader();
        };

        var quantityInput = row.querySelector('.quantity');
        quantityInput.addEventListener('change', function() {
            if (quantityInput.value < 1) quantityInput.value = 1;
            updateCartQuantity(item.id, quantityInput.value);
            updateCartTotals();
        });

        row.querySelector('.remove-btn').addEventListener('click', function() {
            removeFromCart(item.id, row);
        });
    });

    updateCartTotals();

    // Add event listener for checkout button
    var checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', placeOrder);
    }
}

function updateCartQuantity(productId, quantity) {
    var requestBody = {
        type: "Cart",
        apikey: window.userApiKey,
        action: "update",
        product_id: productId,
        quantity: parseInt(quantity)
    };

    makeApiCall(requestBody).then(function(response) {
        console.log("Cart updated:", response.message);
    }).catch(function(error) {
        console.error("Error updating cart:", error);
        alert("Failed to update cart quantity.");
        fetchAndDisplayCartItems(); // Refresh cart
    });
}

function removeFromCart(productId, row) {
    var requestBody = {
        type: "Cart",
        apikey: window.userApiKey,
        action: "remove",
        product_id: productId
    };

    makeApiCall(requestBody).then(function(response) {
        row.remove();
        updateCartTotals();
        console.log("Product removed:", response.message);
    }).catch(function(error) {
        console.error("Error removing from cart:", error);
        alert("Failed to remove product from cart.");
    });
}

function placeOrder() {
    var requestBody = {
        type: "Order",
        apikey: window.userApiKey,
        action: "create"
    };

    makeApiCall(requestBody).then(function(response) {
        alert("Order placed successfully! Order ID: " + response.order_id);
        fetchAndDisplayCartItems(); // Refresh cart (should be empty)
    }).catch(function(error) {
        console.error("Error placing order:", error);
        alert("Failed to place order: " + error.message);
    });
}

function updateCartTotals() {
    var subtotal = 0;
    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var rows = document.querySelectorAll('.cart-table tbody tr');
    
    var vatRate = 0.15;
    var deliveryFee = window.currencyConverter.convertPrice(75, 'ZAR', selectedCurrency);

    rows.forEach(function(row) {
        var priceElement = row.querySelector('.price');
        var price = parseFloat(priceElement.dataset.price) || 0;
        var quantity = parseInt(row.querySelector('.quantity').value) || 1;
        var priceConverted = window.currencyConverter.convertPrice(price, 'ZAR', selectedCurrency);
        var total = priceConverted * quantity;
        
        row.querySelector('.total').innerText = total.toFixed(2) + ' ' + selectedCurrency;
        subtotal += total;
    });

    var vat = subtotal * vatRate;
    var grandTotal = subtotal + vat + deliveryFee;

    var subtotalElement = document.getElementById('subtotal');
    var grandTotalElement = document.getElementById('grand-total');

    if (subtotalElement && grandTotalElement) {
        subtotalElement.innerText = subtotal.toFixed(2) + ' ' + selectedCurrency;
        grandTotalElement.innerText = grandTotal.toFixed(2) + ' ' + selectedCurrency + ' (incl. VAT & Delivery)';
    } else {
        console.error('Cart summary elements not found.');
    }
}

function updateAllPrices(newCurrency) {
    var rows = document.querySelectorAll('.cart-table tbody tr');
    rows.forEach(function(row) {
        var priceElement = row.querySelector('.price');
        if (priceElement) {
            var price = parseFloat(priceElement.dataset.price) || 0;
            var convertedPrice = window.currencyConverter.convertPrice(price, 'ZAR', newCurrency);
            priceElement.innerText = convertedPrice !== null ? convertedPrice.toFixed(2) + ' ' + newCurrency : "Price Not Available";
        }
    });
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}