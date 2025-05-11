console.log("Wishlist script loaded");
document.addEventListener("DOMContentLoaded", function() {
    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        fetchWishlistProducts();
    });

    // Set up event listeners for currency dropdown
    const currencyDropdown = document.getElementById('currency-dropdown');
    if (currencyDropdown) {
        currencyDropdown.addEventListener('change', function() {
            const selectedCurrency = currencyDropdown.value;
            window.currencyConverter.setCurrentCurrency(selectedCurrency);
            updateAllProductPrices(selectedCurrency);
        });
    }

    // Event delegation for wishlist actions
    document.addEventListener('click', function(event) {
        // Handle "Remove from Wishlist" button clicks
        if (event.target.classList.contains('remove-btn')) {
            const productItem = event.target.closest('.wishlist-item');
            const productId = productItem.dataset.productId;
            removeFromWishlist(productId, productItem);
        }
        
        // Handle "Add to Cart" button clicks
        if (event.target.classList.contains('add-to-cart')) {
            // You can implement add to cart functionality here in the future
            alert('Add to cart functionality will be implemented in a future update');
        }
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

function fetchWishlistProducts() {
    // Make API call to get user's wishlist
    var requestBody = {
        type: "Wishlist",
        apikey: window.userApiKey,
        action: "get"
    };

    makeApiCall(requestBody)
        .then(function(products) {
            displayProducts(products);
        })
        .catch(function(error) {
            console.error("Error fetching wishlist:", error);
            displayNoProducts();
        })
        .finally(function() {
            hideMainLoader();
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
        displayNoProducts();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency() || 'ZAR';
    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function(product) {
        var productElement = document.createElement("div");
        productElement.className = "wishlist-item";
        productElement.dataset.productId = product.id;
        
        var title = product.title || "No Title Available";
        var finalPrice = parseFloat(product.final_price) || 0;
        var originalCurrency = product.currency || "ZAR";
        var priceConverted = window.currencyConverter.convertPrice(finalPrice, originalCurrency, selectedCurrency);
        var price = priceConverted !== null && priceConverted !== undefined ? 
            priceConverted.toFixed(2) + " " + selectedCurrency : "Price Not Available";
        var imageUrl = product.image_url || "default-image.jpg";
        var productId = product.id;

        productElement.innerHTML = [
            '<div class="wishlist-info">',
            '<img src="' + imageUrl + '" alt="' + title + '" class="product-image">',
            '<a href="view.php?id=' + productId + '" class="more-info">View More</a>',
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

function displayNoProducts() {
    var wishlistContainer = document.querySelector(".wishlist-container");
    if (wishlistContainer) {
        wishlistContainer.innerHTML = '<div class="empty-wishlist"><p>Your wishlist is empty.</p>' +
            '<a href="index.php" class="browse-products-btn">Browse Products</a></div>';
    }
    hideMainLoader();
}

function removeFromWishlist(productId, productElement) {
    showMainLoader();
    
    var requestBody = {
        type: "Wishlist",
        apikey: window.userApiKey,
        action: "remove",
        product_id: productId
    };

    makeApiCall(requestBody)
        .then(function(response) {
            // Remove product from UI
            if (productElement) {
                productElement.remove();
                
                // Check if wishlist is now empty
                const wishlistItems = document.querySelectorAll('.wishlist-item');
                if (wishlistItems.length === 0) {
                    displayNoProducts();
                }
            }
        })
        .catch(function(error) {
            console.error("Error removing product from wishlist:", error);
            alert("Failed to remove product from wishlist. Please try again.");
        })
        .finally(function() {
            hideMainLoader();
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
            priceElement.textContent = convertedPrice !== null && convertedPrice !== undefined ? 
                convertedPrice.toFixed(2) + " " + newCurrency : "Price Not Available";
        }
    });
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost/COS216_WHEATLEY/api.php", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    console.log("API Response:", data);
                    if (data.status === "success") {
                        resolve(data.data);
                    } else {
                        console.error("API Error:", data.message || "Error fetching data");
                        reject(new Error(data.message || "Error fetching data"));
                    }
                } catch (e) {
                    console.error("Invalid JSON response", e);
                    reject(new Error("Invalid response from server"));
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
    });
}