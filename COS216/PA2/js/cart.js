var apiUrl = 'https://wheatley.cs.up.ac.za/api/';
var apiKey = 'ae575ccbd3973ae1ac92ea4ec40f8b43';
var studentNum = 'u22747363';

document.addEventListener("DOMContentLoaded", function() {
    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        setupCurrencyListener();
        fetchAndDisplayCartItems();
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
        });
    } else {
        console.warn("Currency dropdown not found");
    }
}

function fetchProducts() {
    var requestBody = {
        studentnum: studentNum,
        apikey: apiKey,
        type: 'GetAllProducts',
        return: ['id', 'title', 'image_url', 'final_price', 'currency'],
        limit: 5,
        sort: 'id',
        order: 'ASC'
    };

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", apiUrl, true); // true = asynchronous
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                console.log("API Response:", data);
                if (data.status === 'success') {
                    resolve(data.data);
                } else {
                    console.error("API Error:", data.message || "Error fetching data");
                    resolve([]); // Return empty array on API failure
                }
            } else {
                console.error("HTTP error: " + xhr.status);
                reject(new Error("HTTP error: " + xhr.status));
            }
        };

        xhr.onerror = function() {
            console.error('Fetch Error:', xhr.statusText);
            reject(new Error(xhr.statusText));
        };

        xhr.send(JSON.stringify(requestBody));
    }).catch(function(error) {
        console.error('Fetch Error:', error);
        hideMainLoader(); // Hide loader on error
        return [];
    });
}

function fetchAndDisplayCartItems() {
    fetchProducts().then(function(products) {
        displayCartItems(products);
    });
}

function displayCartItems(products) {
    var cartTableBody = document.querySelector('.cart-table tbody');
    if (!cartTableBody) {
        console.error("Cart table body not found in the DOM");
        hideMainLoader();
        return;
    }

    cartTableBody.innerHTML = '';

    if (products.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="6">No items in cart.</td></tr>';
        hideMainLoader();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function(product) {
        var row = document.createElement('tr');
        row.classList.add('Details');

        var price = parseFloat(product.final_price) || 0;
        var originalCurrency = product.currency || 'USD';
        var originalPrice = price * 1.15; 
        
        var priceConverted = window.currencyConverter.convertPrice(price, originalCurrency, selectedCurrency);
        var displayPrice = priceConverted !== null && priceConverted !== undefined ? priceConverted.toFixed(2) + ' ' + selectedCurrency : "Price Not Available";
        var productId = product.id;

        row.innerHTML = 
            '<td><img src="' + (product.image_url || 'default-image.jpg') + '" alt="' + product.title + '" class="product-image">' +
            '<br><a href="view.html?id=' + productId + '" class="more-info">More Information</a></td>' +
            '<td>' + (product.title || 'No Title') + '</td>' +
            '<td class="price" ' +
                'data-original-price="' + price + '" ' +
                'data-original-currency="' + originalCurrency + '"' +
                'data-undiscounted-price="' + originalPrice + '">' + displayPrice + '</td>' +
            '<td><input type="number" value="1" min="1" class="quantity"></td>' +
            '<td class="total">' + displayPrice + '</td>' +
            '<td><button class="remove-btn">Remove from Cart</button></td>';

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
        quantityInput.addEventListener('input', function() {
            if (quantityInput.value < 1) quantityInput.value = 1;
            updateCartTotals();
        });

        row.querySelector('.remove-btn').addEventListener('click', function() {
            row.remove();
            updateCartTotals();
        });
    });

    updateCartTotals();
}

function updateCartTotals() {
    var subtotal = 0;  // Original prices before discount
    var discountedTotal = 0;  // Final prices after discount
    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var rows = document.querySelectorAll('.cart-table tbody tr');
    
    var vatRate = 0.15;
    var deliveryFee = 75; 

    rows.forEach(function(row) {
        var priceElement = row.querySelector('.price');
        var originalPrice = parseFloat(priceElement.dataset.originalPrice) || 0;
        var originalCurrency = priceElement.dataset.originalCurrency || 'USD';
        var priceConverted = window.currencyConverter.convertPrice(originalPrice, originalCurrency, selectedCurrency);
        var quantity = parseInt(row.querySelector('.quantity').value) || 1;
        
        var total = priceConverted * quantity;
        
        row.querySelector('.total').innerText = total.toFixed(2) + ' ' + selectedCurrency;
        
        discountedTotal += total;
        
        var originalUndiscountedPrice = originalPrice * 1.15; 
        var originalUndiscountedConverted = window.currencyConverter.convertPrice(
            originalUndiscountedPrice, originalCurrency, selectedCurrency
        );
        subtotal += originalUndiscountedConverted * quantity;
    });

    var vat = discountedTotal * vatRate;
    
    var grandTotal = discountedTotal + vat + deliveryFee;

    var subtotalElement = document.getElementById('subtotal');
    var grandTotalElement = document.getElementById('grand-total');

    if (subtotalElement && grandTotalElement) {
        subtotalElement.innerText = subtotal.toFixed(2) + ' ' + selectedCurrency;
        grandTotalElement.innerText = grandTotal.toFixed(2) + ' ' + selectedCurrency + ' ((DISCOUNT PRICE) incl. VAT & Delivery)';
    } else {
        console.error('Cart summary elements not found.');
    }
}

function updateAllPrices(newCurrency) {
    var rows = document.querySelectorAll('.cart-table tbody tr');
    rows.forEach(function(row) {
        var priceElement = row.querySelector('.price');
        if (priceElement) {
            var originalPrice = parseFloat(priceElement.dataset.originalPrice) || 0;
            var originalCurrency = priceElement.dataset.originalCurrency || 'USD';
            var convertedPrice = window.currencyConverter.convertPrice(originalPrice, originalCurrency, newCurrency);
            priceElement.innerText = convertedPrice !== null && convertedPrice !== undefined ? convertedPrice.toFixed(2) + ' ' + newCurrency : "Price Not Available";
        }
    });
    updateCartTotals();
}