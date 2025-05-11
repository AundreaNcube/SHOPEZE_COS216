// orders.js
document.addEventListener("DOMContentLoaded", function() {
    if (!window.userApiKey) {
        alert("Please log in to view your orders.");
        window.location.href = 'login.php';
        return;
    }

    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        fetchAndDisplayOrders();
    }).catch(function(error) {
        console.error("Failed to fetch currency rates:", error);
        fetchAndDisplayOrders();
    });
});

var mainLoader = document.getElementById('loader-container');
var contentContainer = document.querySelector('.orders-container');

function showMainLoader() {
    if (mainLoader) mainLoader.style.display = 'flex';
    if (contentContainer) contentContainer.style.display = 'none';
}

function hideMainLoader() {
    if (mainLoader) mainLoader.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost/COS216_WHEATLEY/api.php", true);
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

function fetchAndDisplayOrders() {
    var requestBody = {
        type: "Order",
        apikey: window.userApiKey,
        action: "get"
    };

    makeApiCall(requestBody).then(function(orders) {
        displayOrders(orders);
    }).catch(function(error) {
        console.error("Error fetching orders:", error);
        displayOrders([]);
    });
}

function displayOrders(orders) {
    var ordersList = document.querySelector('.orders-list');
    if (!ordersList) {
        console.error("Orders list container not found in the DOM");
        hideMainLoader();
        return;
    }

    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        hideMainLoader();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var totalImages = orders.reduce((sum, order) => sum + (order.products ? order.products.length : 0), 0);
    var loadedImages = 0;

    orders.forEach(function(order) {
        var orderCard = document.createElement('div');
        orderCard.classList.add('order-card');

        var productRows = '';
        var subtotal = 0;

        if (order.products && order.products.length > 0) {
            order.products.forEach(function(product) {
                var price = parseFloat(product.final_price) || 0;
                var priceConverted = window.currencyConverter.convertPrice(price, 'ZAR', selectedCurrency);
                var totalPrice = (priceConverted * product.quantity).toFixed(2) + ' ' + selectedCurrency;

                productRows += `
                    <tr>
                        <td><img src="${product.image_url || 'default-image.jpg'}" alt="${sanitizeInput(product.title)}" class="product-image"></td>
                        <td>${sanitizeInput(product.title || 'No Title')}</td>
                        <td>${priceConverted.toFixed(2)} ${selectedCurrency}</td>
                        <td>${product.quantity}</td>
                        <td>${totalPrice}</td>
                    </tr>
                `;

                subtotal += priceConverted * product.quantity;
            });
        } else {
            productRows = '<tr><td colspan="5">No products in this order.</td></tr>';
        }

        var vat = subtotal * 0.15;
        var deliveryFee = window.currencyConverter.convertPrice(75, 'ZAR', selectedCurrency);
        var grandTotal = subtotal + vat + deliveryFee;

        orderCard.innerHTML = `
            <h2>Order #${order.order_id}</h2>
            <p>Status: ${order.state}</p>
            <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p>Delivery Date: ${new Date(order.delivery_date).toLocaleDateString()}</p>
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${productRows}
                </tbody>
            </table>
            <div class="order-summary">
                <p>Subtotal: ${subtotal.toFixed(2)} ${selectedCurrency}</p>
                <p>VAT (15%): ${vat.toFixed(2)} ${selectedCurrency}</p>
                <p>Delivery Fee: ${deliveryFee.toFixed(2)} ${selectedCurrency}</p>
                <p>Grand Total: ${grandTotal.toFixed(2)} ${selectedCurrency}</p>
            </div>
        `;

        ordersList.appendChild(orderCard);

        var images = orderCard.querySelectorAll('.product-image');
        images.forEach(function(img) {
            img.onload = function() {
                loadedImages++;
                if (loadedImages >= totalImages) hideMainLoader();
            };
            img.onerror = function() {
                img.src = 'default-image.jpg';
                loadedImages++;
                if (loadedImages >= totalImages) hideMainLoader();
            };
        });
    });

    hideMainLoader();
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}