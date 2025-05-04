var studentNum = "u22747363";
var apiKey = "ae575ccbd3973ae1ac92ea4ec40f8b43";

document.addEventListener("DOMContentLoaded", function() {
    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        fetchAndDisplayProducts();
    });
});

var mainLoader = document.getElementById('loader-container');
var contentContainer = document.querySelector('.wishlist-container');

function showMainLoader() {
    if (mainLoader) mainLoader.style.display = 'flex';
    if (contentContainer) contentContainer.style.display = 'none';
}

function hideMainLoader() {
    if (mainLoader) mainLoader.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
}

function fetchProducts() {
    var requestBody = {
        studentnum: studentNum,
        apikey: apiKey,
        type: "GetAllProducts",
        return: ["id", "brand", "title", "image_url", "department", "final_price", "currency"],
        limit: 5,
        sort: "title",
        order: "ASC"
    };

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                console.log("API Response:", data);
                if (data.status === "success") {
                    resolve(data.data);
                } else {
                    console.error("API Error:", data.message || "Error fetching data");
                    resolve([]);
                }
            } else {
                console.error("HTTP error: " + xhr.status);
                reject(new Error("HTTP error: " + xhr.status));
            }
        };

        xhr.onerror = function() {
            console.error("Network Error:", xhr.statusText);
            reject(new Error("Network error"));
        };

        xhr.send(JSON.stringify(requestBody));
    }).catch(function(error) {
        console.error("Error fetching products:", error);
        return [];
    });
}

function fetchAndDisplayProducts() {
    fetchProducts().then(function(products) {
        displayProducts(products);
    });
}

function displayProducts(products) {
    var wishlistContainer = document.querySelector(".wishlist-container");
    if (!wishlistContainer) {
        console.error("Wishlist container not found in the DOM");
        hideMainLoader();
        return;
    }

    wishlistContainer.innerHTML = '';

    if (products.length === 0) {
        wishlistContainer.innerHTML = "<p>No products found.</p>";
        hideMainLoader();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function(product) {
        var productElement = document.createElement("div");
        productElement.className = "wishlist-item";  
        var title = product.title || "No Title Available";
        // var brand = product.brand || "Unknown Brand";
        var finalPrice = parseFloat(product.final_price) || 0;
        var originalCurrency = product.currency || "USD";
        var priceConverted = window.currencyConverter.convertPrice(finalPrice, originalCurrency, selectedCurrency);
        var price = priceConverted !== null && priceConverted !== undefined ? priceConverted.toFixed(2) + " " + selectedCurrency : "Price Not Available";
        var imageUrl = product.image_url || "default-image.jpg";
        var productId = product.id;

        productElement.innerHTML = [
            '<div class="wishlist-info">',
            '<img src="' + imageUrl + '" alt="' + title + '" class="product-image">',
            '<a href="view.html?id=' + productId + '" class="more-info">View More</a>',
            '<h2>' + title + '</h2>',
            '</div>',
            '<div class="wishlist-actions">',
            '<p class="price" data-original-price="' + finalPrice + '" data-original-currency="' + originalCurrency + '">' + price + '</p>',
            '<button class="add-to-cart">Add to Cart</button>',
            '<button class="remove-btn">Remove from Wishlist</button>',
            '</div>'
        ].join("");

        wishlistContainer.appendChild(productElement);

        var img = productElement.querySelector(".product-image");
        img.onload = function() {
            loadedImages++;
            if (loadedImages >= totalImages) hideMainLoader();
        };
        img.onerror = function() {
            img.src = "default-image.jpg";
            loadedImages++;
            if (loadedImages >= totalImages) hideMainLoader();
        };
    });
}

function updateAllProductPrices(newCurrency) {
    var wishlistItems = document.querySelectorAll('.wishlist-item');
    wishlistItems.forEach(function(item) {
        var priceElement = item.querySelector('.price');
        if (priceElement) {
            var originalPrice = parseFloat(priceElement.dataset.originalPrice);
            var originalCurrency = priceElement.dataset.originalCurrency;
            var convertedPrice = window.currencyConverter.convertPrice(originalPrice, originalCurrency, newCurrency);
            priceElement.textContent = convertedPrice !== null && convertedPrice !== undefined ? convertedPrice.toFixed(2) + " " + newCurrency : "Price Not Available";
        }
    });
    hideMainLoader();
}