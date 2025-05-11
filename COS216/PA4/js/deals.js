document.addEventListener("DOMContentLoaded", function () {
    const apiKey = localStorage.getItem("apikey");
    if (!apiKey) {
        console.error("User API key not found. Please log in.");
        alert("Please log in to view deals.");
        window.location.href = 'login.php';
        return;
    }

    showMainLoader();
    window.currencyConverter.fetchRates().then(function(rates) {
        console.log("Currency rates fetched successfully:", rates);
        initializeFiltersAndProducts();
    }).catch(function(error) {
        console.error("Failed to fetch currency rates, proceeding with ZAR only:", error);
        initializeFiltersAndProducts(); // Proceed with ZAR as fallback
    });
});

var mainLoader = document.getElementById('loader-container');
var contentContainer = document.getElementById('content');

function showMainLoader() {
    if (mainLoader) mainLoader.style.display = 'flex';
    if (contentContainer) contentContainer.style.display = 'none';
}

function hideMainLoader() {
    if (mainLoader) mainLoader.style.display = 'none';
    if (contentContainer) contentContainer.style.display = 'block';
}

function initializeFiltersAndProducts() {
    Promise.all([
        fetchDistinct("department"),
        fetchDistinct("brand"),
        fetchDistinct("country_of_origin")
    ]).then(function (results) {
        var departments = results[0];
        var brands = results[1];
        var countries = results[2];

        populateFilterOptions("category-options", departments);
        populateFilterOptions("brand-options", brands);
        populateFilterOptions("country-options", countries);

        setupEventListeners();
        fetchProducts();
    }).catch(function (error) {
        console.error("Error initializing filters:", error);
        displayNoResults();
        hideMainLoader();
    });
}

function fetchDistinct(field) {
    var requestBody = {
        type: "GetAllProducts",
        apikey: localStorage.getItem("apikey"),
        return: [field],
        limit: 20,
        fuzzy: false
    };

    return makeApiCall(requestBody).then(function (products) {
        var uniqueValues = [...new Set(products.map(product => product[field]).filter(Boolean))];
        return uniqueValues;
    });
}

function populateFilterOptions(id, values) {
    var container = document.getElementById(id);
    if (!container) {
        console.error("Container not found: " + id);
        return;
    }

    container.innerHTML = "";
    values.forEach(function (value) {
        if (!value) return;

        var label = document.createElement("label");
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = id.replace("-options", "");
        checkbox.value = value;
        checkbox.addEventListener("change", fetchProducts);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" " + value));
        container.appendChild(label);
        container.appendChild(document.createElement("br"));
    });
}

function setupEventListeners() {
    var buttons = document.querySelectorAll(".dropdown-btn");
    buttons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.stopPropagation();
            var contents = document.querySelectorAll('.dropdown-content');
            contents.forEach(function (content) {
                if (content !== button.nextElementSibling) {
                    content.style.display = "none";
                }
            });
            var content = button.nextElementSibling;
            content.style.display = content.style.display === "block" ? "none" : "block";
            var dropdownContainer = button.closest('.dropdown');
            if (dropdownContainer) {
                dropdownContainer.dataset.clickOpen = content.style.display === "block" ? "true" : "false";
            }
        });

        var dropdownContainer = button.closest('.dropdown');
        if (dropdownContainer) {
            dropdownContainer.addEventListener("mouseenter", function () {
                var content = button.nextElementSibling;
                if (dropdownContainer.dataset.clickOpen !== "true") {
                    content.style.display = "block";
                }
            });
            dropdownContainer.addEventListener("mouseleave", function () {
                var content = button.nextElementSibling;
                if (dropdownContainer.dataset.clickOpen !== "true") {
                    content.style.display = "none";
                }
            });
        }
    });

    document.addEventListener("click", function (event) {
        var dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(function (dropdown) {
            if (dropdown.style.display === 'block' && !dropdown.contains(event.target) && dropdown.previousElementSibling !== event.target) {
                dropdown.style.display = 'none';
                if (dropdown.closest('.dropdown')) {
                    dropdown.closest('.dropdown').dataset.clickOpen = "false";
                }
            }
        });
    });

    var searchButton = document.querySelector(".search button");
    if (searchButton) searchButton.addEventListener("click", fetchProducts);

    var searchInput = document.querySelector(".search .input");
    if (searchInput) {
        searchInput.addEventListener("keypress", function (event) {
            if (event.key === "Enter") fetchProducts();
        });
    }

    var sortSelect = document.querySelector("#sort");
    if (sortSelect) sortSelect.addEventListener("change", fetchProducts);

    var priceRangeSelect = document.querySelector("#price-range");
    if (priceRangeSelect) priceRangeSelect.addEventListener("change", fetchProducts);

    var checkboxes = document.querySelectorAll(".dropdown-content input");
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener("change", fetchProducts);
    });

    var currencyDropdown = document.querySelector("#currency-dropdown");
    if (currencyDropdown) {
        currencyDropdown.addEventListener("change", function () {
            window.currencyConverter.setCurrentCurrency(currencyDropdown.value);
            filterAndDisplayProducts(currentProducts);
        });
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
                console.log("API Response:", JSON.stringify(data, null, 2));
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
    }).catch(function(error) {
        console.error("Fetch Error:", error);
        return [];
    });
}

var currentProducts = [];

function fetchProducts() {
    showMainLoader();
    var searchQuery = document.querySelector(".search .input") ? document.querySelector(".search .input").value.trim() : "";
    var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "final_price-asc";
    var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";

    var selectedDepartments = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    var selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
    var selectedCountries = Array.from(document.querySelectorAll('input[name="country"]:checked')).map(cb => cb.value);

    var search = {};
    if (selectedDepartments.length > 0) search.department = selectedDepartments.join(",");
    if (selectedBrands.length > 0) search.brand = selectedBrands.join(",");
    if (selectedCountries.length > 0) search.country_of_origin = selectedCountries.join(",");

    var apiSort = sortValue.split('-')[0];
    var apiOrder = sortValue.split('-')[1].toUpperCase();
    if (apiSort === "discount") {
        apiSort = null;
        apiOrder = null;
    }

    var requestBody = {
        type: "GetAllProducts",
        apikey: localStorage.getItem("apikey"),
        return: ["id", "title", "brand", "initial_price", "final_price", "image_url", "categories", "department", "country_of_origin"],
        limit: 250,
        fuzzy: true
    };

    if (apiSort) {
        requestBody.sort = apiSort;
        requestBody.order = apiOrder;
    }
    if (Object.keys(search).length > 0) {
        requestBody.search = search;
    }
    if (priceRange !== "all") {
        requestBody.search = requestBody.search || {};
        requestBody.search.pricemax = parseFloat(priceRange);
        console.log("Applied price filter: Max price =", priceRange, "ZAR");
    }

    if (searchQuery) {
        var fieldRequestBody = JSON.parse(JSON.stringify(requestBody));
        fieldRequestBody.search = fieldRequestBody.search || {};
        fieldRequestBody.search.title = searchQuery;

        makeApiCall(fieldRequestBody)
            .then(function (products) {
                console.log("Products received:", products.length);
                if (products.length === 0) {
                    console.log("No products returned from API. Displaying fallback message.");
                    displayNoResults();
                } else {
                    processDealsProducts(products);
                }
            })
            .catch(function (error) {
                console.error("Error fetching products:", error);
                displayNoResults();
            })
            .finally(function () {
                hideMainLoader();
            });
    } else {
        console.log("Sending API request:", JSON.stringify(requestBody));
        makeApiCall(requestBody)
            .then(function (products) {
                console.log("Products received:", products.length);
                if (products.length === 0) {
                    console.log("No products returned from API. Displaying fallback message.");
                    displayNoResults();
                } else {
                    processDealsProducts(products);
                }
            })
            .catch(function (error) {
                console.error("Error fetching products:", error);
                displayNoResults();
            })
            .finally(function () {
                hideMainLoader();
            });
    }
}

function processDealsProducts(products) {
    products = products.filter(function (product) {
        return calculateDiscountPercentage(product.initial_price, product.final_price) >= 10;
    });

    var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "final_price-asc";
    sortProducts(products, sortValue);

    currentProducts = products;
    filterAndDisplayProducts(products);
}

function sortProducts(products, sortValue) {
    var selectedCurrency = window.currencyConverter.getCurrentCurrency();
    if (sortValue === "final_price-asc") {
        products.sort(function (a, b) {
            var priceA = window.currencyConverter.convertPrice(parseFloat(a.final_price) || 0, "ZAR", selectedCurrency);
            var priceB = window.currencyConverter.convertPrice(parseFloat(b.final_price) || 0, "ZAR", selectedCurrency);
            return priceA - priceB;
        });
    } else if (sortValue === "final_price-desc") {
        products.sort(function (a, b) {
            var priceA = window.currencyConverter.convertPrice(parseFloat(a.final_price) || 0, "ZAR", selectedCurrency);
            var priceB = window.currencyConverter.convertPrice(parseFloat(b.final_price) || 0, "ZAR", selectedCurrency);
            return priceB - priceA;
        });
    } else if (sortValue === "discount-asc") {
        products.sort(function (a, b) {
            var discountA = calculateDiscountPercentage(a.initial_price, a.final_price);
            var discountB = calculateDiscountPercentage(b.initial_price, b.final_price);
            return discountA - discountB;
        });
    } else if (sortValue === "discount-desc") {
        products.sort(function (a, b) {
            var discountA = calculateDiscountPercentage(a.initial_price, a.final_price);
            var discountB = calculateDiscountPercentage(b.initial_price, b.final_price);
            return discountB - discountA;
        });
    }
}

function calculateDiscountPercentage(initialPrice, finalPrice) {
    var initial = parseFloat(initialPrice);
    var final = parseFloat(finalPrice);
    if (initial && final && initial > 0 && initial > final) {
        return ((initial - final) / initial) * 100;
    }
    return 0;
}

function filterAndDisplayProducts(products) {
    var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";
    var selectedCurrency = window.currencyConverter.getCurrentCurrency();
    var filteredProducts = products;

    if (priceRange !== "all") {
        var maxPrice = parseFloat(priceRange);
        filteredProducts = filteredProducts.filter(function (product) {
            var priceInSelectedCurrency = window.currencyConverter.convertPrice(
                parseFloat(product.final_price) || 0,
                "ZAR",
                selectedCurrency
            );
            return priceInSelectedCurrency <= maxPrice;
        });
    }

    displayProducts(filteredProducts);
}

function displayProducts(products) {
    var productContainer = document.querySelector(".product-grid");
    if (!productContainer) {
        console.error("Product grid container not found");
        hideMainLoader();
        return;
    }

    productContainer.innerHTML = "";
    if (products.length === 0) {
        displayNoResults();
        return;
    }

    var selectedCurrency = window.currencyConverter.getCurrentCurrency();
    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function (product) {
        var productCard = document.createElement("div");
        productCard.classList.add("product");
        productCard.dataset.productId = product.id; // Add product ID as data attribute

        var title = sanitizeInput(product.title || "No Title Available");
        var brand = sanitizeInput(product.brand || "Unknown Brand");
        var initialPrice = parseFloat(product.initial_price) || 0;
        var finalPrice = parseFloat(product.final_price) || 0;
        var initialPriceConverted = window.currencyConverter.convertPrice(initialPrice, "ZAR", selectedCurrency);
        var finalPriceConverted = window.currencyConverter.convertPrice(finalPrice, "ZAR", selectedCurrency);
        var discountPercentage = calculateDiscountPercentage(product.initial_price, product.final_price).toFixed(2);
        var imageUrl = sanitizeInput(product.image_url || "default-image.jpg");
        var productId = sanitizeInput(product.id);

        productCard.innerHTML = [
            '<div class="image-container">',
            '<div class="product-loader">',
            '<div class="boxes">',
            '<div class="box"><div></div><div></div><div></div><div></div></div>',
            '<div class="box"><div></div><div></div><div></div><div></div></div>',
            '<div class="box"><div></div><div></div><div></div><div></div></div>',
            '<div class="box"><div></div><div></div><div></div><div></div></div>',
            '</div>',
            '</div>',
            '<img src="' + imageUrl + '" alt="' + title + '" class="product-image">',
            '</div>',
            '<h2>' + title + '</h2>',
            '<div class="product-details">',
            '<p>Brand: ' + brand + '</p>',
            '<p><s>' + initialPriceConverted.toFixed(2) + ' ' + selectedCurrency + '</s></p>',
            '<p>' + finalPriceConverted.toFixed(2) + ' ' + selectedCurrency + '</p>',
            '<p>Discount: ' + discountPercentage + '%</p>',
            '<a href="view.php?id=' + productId + '" class="more-info">More Information</a>',
            '<button class="Add-to add-to-cart">Add to Cart</button>',
            '<button class="Add-to add-to-wishlist">Add to Wishlist</button>',
            '</div>'
        ].join('');

        productContainer.appendChild(productCard);

        var img = productCard.querySelector(".product-image");
        var loader = productCard.querySelector(".product-loader");

        function checkAllImagesLoaded() {
            loadedImages++;
            if (loadedImages >= totalImages) {
                hideMainLoader();
            }
        }

        img.onload = function () {
            loader.style.display = "none";
            checkAllImagesLoaded();
        };

        img.onerror = function () {
            loader.style.display = "none";
            img.src = "default-image.jpg";
            checkAllImagesLoaded();
        };
    });
}

// Add event listener for "Add to Wishlist" button clicks
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-wishlist')) {
        const productCard = event.target.closest('.product');
        const productId = productCard.dataset.productId;
        addToWishlist(productId, event.target);
    }
});

// Function to handle adding a product to the wishlist
function addToWishlist(productId, button) {
    // Check if user is logged in
    const apiKey = localStorage.getItem("apikey");
    if (!apiKey) {
        alert('Please log in to add items to your wishlist');
        window.location.href = 'login.php';
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = 'Adding...';
    button.disabled = true;
    
    var requestBody = {
        type: "Wishlist",
        apikey: apiKey,
        action: "add",
        product_id: productId
    };
    
    // Make API call to add product to wishlist
    makeApiCall(requestBody)
        .then(function(response) {
            button.textContent = 'Added to Wishlist';
            button.classList.add('added-to-wishlist');
            setTimeout(function() {
                button.textContent = originalText;
                button.classList.remove('added-to-wishlist');
            }, 2000);
        })
        .catch(function(error) {
            console.error("Error adding to wishlist:", error);
            button.textContent = 'Error';
            setTimeout(function() {
                button.textContent = originalText;
            }, 2000);
        })
        .finally(function() {
            button.disabled = false;
        });
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-cart')) {
        const productCard = event.target.closest('.product');
        const productId = productCard.dataset.productId;
        addToCart(productId, event.target);
    }
});

function addToCart(productId, button) {
    // Check if user is logged in
    const apiKey = localStorage.getItem("apikey");
    if (!apiKey) {
        alert('Please log in to add items to your cart');
        window.location.href = 'login.php';
        return;
    }
    
    // Show loading state
    const originalText = button.textContent;
    button.textContent = 'Adding...';
    button.disabled = true;
    
    var requestBody = {
        type: "Cart",
        apikey: apiKey,
        action: "add",
        product_id: productId,
        quantity: 1
    };
    
    // Make API call to add product to cart
    makeApiCall(requestBody)
        .then(function(response) {
            button.textContent = 'Added to Cart';
            button.classList.add('added-to-cart');
            setTimeout(function() {
                button.textContent = originalText;
                button.classList.remove('added-to-cart');
            }, 2000);
        })
        .catch(function(error) {
            console.error("Error adding to cart:", error);
            button.textContent = 'Error';
            setTimeout(function() {
                button.textContent = originalText;
            }, 2000);
        })
        .finally(function() {
            button.disabled = false;
        });
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function displayNoResults() {
    var productContainer = document.querySelector(".product-grid");
    if (productContainer) {
        productContainer.innerHTML = '<p class="no-results">No deals found. Please try different search or filter criteria.</p>';
    }
    hideMainLoader();
}

document.addEventListener("click", function (event) {
    if (!event.target.matches('.dropdown-btn')) {
        var dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(function (dropdown) {
            if (dropdown.style.display === 'block' && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
});