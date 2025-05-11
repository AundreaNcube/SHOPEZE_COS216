console.log("Hieeee");
document.addEventListener("DOMContentLoaded", function() {
    const apiKey = localStorage.getItem("apikey") || window.userApiKey;
    if (!apiKey) {
        console.error("User API key not found. Please log in.");
        alert("Please log in to view products.");
        window.location.href = 'login.php';
        return;
    }

    // Validate API key
    validateApiKey(apiKey).then(isValid => {
        if (!isValid) {
            console.error("Invalid API key. Redirecting to login.");
            localStorage.removeItem("apikey");
            alert("Your session is invalid. Please log in again.");
            window.location.href = 'login.php';
            return;
        }

        console.log("User API key found: " + apiKey);
        showMainLoader();

        // Fetch currency rates and preferences before proceeding
        Promise.all([
            window.currencyConverter.fetchRates(),
            fetchPreferences()
        ]).then(function([rates, preferences]) {
            console.log("Currency rates fetched successfully:", rates);
            console.log("Preferences fetched:", preferences);
            Promise.all([
                fetchDistinct("department"),
                fetchDistinct("brand"),
                fetchDistinct("country_of_origin")
            ]).then(function(results) {
                var departments = results[0];
                var brands = results[1];
                var countries = results[2];

                populateFilterOptions("category-options", departments);
                populateFilterOptions("brand-options", brands);
                populateFilterOptions("country-options", countries);

                // Apply saved preferences if they exist
                applyPreferences(preferences);

                setupEventListeners();
                fetchProducts();
            }).catch(function(error) {
                console.error("Error initializing filters:", error);
                displayNoResults();
                hideMainLoader();
            });
        }).catch(function(error) {
            console.error("Failed to fetch currency rates or preferences, proceeding with default:", error);
            Promise.all([
                fetchDistinct("department"),
                fetchDistinct("brand"),
                fetchDistinct("country_of_origin")
            ]).then(function(results) {
                var departments = results[0];
                var brands = results[1];
                var countries = results[2];

                populateFilterOptions("category-options", departments);
                populateFilterOptions("brand-options", brands);
                populateFilterOptions("country-options", countries);

                setupEventListeners();
                fetchProducts();
            }).catch(function(error) {
                console.error("Error initializing filters:", error);
                displayNoResults();
                hideMainLoader();
            });
        });
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

function validateApiKey(apiKey) {
    return makeApiCall({
        type: "GetAllProducts",
        apikey: apiKey,
        return: ["id"],
        limit: 1
    }).then(() => true).catch(error => {
        console.error("API key validation failed:", error);
        return false;
    });
}

function fetchPreferences() {
    var requestBody = {
        type: "Preferences",
        apikey: localStorage.getItem("apikey") || window.userApiKey,
        action: "get"
    };

    return makeApiCall(requestBody).then(function(preferences) {
        return preferences || {};
    }).catch(function(error) {
        console.error("Error fetching preferences:", error);
        return {};
    });
}

function applyPreferences(preferences) {
    if (!preferences || Object.keys(preferences).length === 0) {
        console.log("No saved preferences to apply.");
        return;
    }

    // Apply department filters
    if (preferences.department) {
        var departments = preferences.department.split(',');
        document.querySelectorAll('input[name="category"]').forEach(function(checkbox) {
            if (departments.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    // Apply brand filters
    if (preferences.brand) {
        var brands = preferences.brand.split(',');
        document.querySelectorAll('input[name="brand"]').forEach(function(checkbox) {
            if (brands.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    // Apply country_of_origin filters
    if (preferences.country_of_origin) {
        var countries = preferences.country_of_origin.split(',');
        document.querySelectorAll('input[name="country"]').forEach(function(checkbox) {
            if (countries.includes(checkbox.value)) {
                checkbox.checked = true;
            }
        });
    }

    // Apply pricemax filter
    if (preferences.pricemax) {
        var priceRangeSelect = document.querySelector("#price-range");
        if (priceRangeSelect) {
            var validOptions = ['500', '1500', '5000'];
            var pricemaxStr = preferences.pricemax.toString();
            if (validOptions.includes(pricemaxStr)) {
                priceRangeSelect.value = pricemaxStr;
            } else {
                priceRangeSelect.value = 'all';
            }
        }
    }

    // Currency is now managed via localStorage in currency.js, so we don't apply it here
}

function savePreferences() {
    var saveButton = document.querySelector("#save-preferences");
    if (!saveButton) {
        console.error("Save preferences button not found");
        return;
    }

    saveButton.textContent = 'Saving...';
    saveButton.classList.add('saving');
    saveButton.disabled = true;

    var selectedDepartments = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
    var selectedBrands = Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(cb => cb.value);
    var selectedCountries = Array.from(document.querySelectorAll('input[name="country"]:checked')).map(cb => cb.value);
    var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";

    var requestBody = {
        type: "Preferences",
        apikey: localStorage.getItem("apikey") || window.userApiKey,
        action: "save",
        department: selectedDepartments.length > 0 ? selectedDepartments.join(",") : null,
        brand: selectedBrands.length > 0 ? selectedBrands.join(",") : null,
        country_of_origin: selectedCountries.length > 0 ? selectedCountries.join(",") : null,
        pricemax: priceRange !== "all" ? parseFloat(priceRange) : null
        // Removed currency from the request body
    };

    makeApiCall(requestBody)
        .then(function(response) {
            saveButton.textContent = 'Saved!';
            setTimeout(function() {
                saveButton.textContent = 'Save Preferences';
                saveButton.classList.remove('saving');
                saveButton.disabled = false;
            }, 2000);
        })
        .catch(function(error) {
            console.error("Error saving preferences:", error);
            saveButton.textContent = 'Error';
            setTimeout(function() {
                saveButton.textContent = 'Save Preferences';
                saveButton.classList.remove('saving');
                saveButton.disabled = false;
            }, 2000);
        });
}

function resetPreferences() {
    var resetButton = document.querySelector("#reset-preferences");
    if (!resetButton) {
        console.error("Reset preferences button not found");
        return;
    }

    resetButton.textContent = 'Resetting...';
    resetButton.disabled = true;

    var requestBody = {
        type: "Preferences",
        apikey: localStorage.getItem("apikey") || window.userApiKey,
        action: "reset"
    };

    console.log("Resetting preferences with request:", JSON.stringify(requestBody)); // Debug request

    makeApiCall(requestBody)
        .then(function(response) {
            console.log("Preferences reset successfully:", response);
            resetButton.textContent = 'Reset!';
            // Uncheck all filters and reset dropdowns
            document.querySelectorAll('input[name="category"]').forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('input[name="brand"]').forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('input[name="country"]').forEach(checkbox => checkbox.checked = false);
            var priceRangeSelect = document.querySelector("#price-range");
            if (priceRangeSelect) priceRangeSelect.value = 'all';
            // Reset currency in localStorage
            var currencyDropdown = document.querySelector("#currency-dropdown");
            if (currencyDropdown) {
                currencyDropdown.value = 'ZAR';
                window.currencyConverter.setCurrentCurrency('ZAR'); // This updates localStorage
            }
            // Refresh products to reflect the reset filters
            fetchProducts();
            setTimeout(function() {
                resetButton.textContent = 'Reset Preferences';
                resetButton.disabled = false;
            }, 2000);
        })
        .catch(function(error) {
            console.error("Error resetting preferences:", error);
            resetButton.textContent = 'Error: ' + (error.message || 'Unknown error');
            setTimeout(function() {
                resetButton.textContent = 'Reset Preferences';
                resetButton.disabled = false;
            }, 2000);
        });
}

function fetchDistinct(field) {
    var requestBody = {
        type: "GetAllProducts",
        apikey: localStorage.getItem("apikey") || window.userApiKey,
        return: [field],
        limit: 20,
        fuzzy: false
    };

    return makeApiCall(requestBody).then(function(products) {
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

    values.forEach(function(value) {
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
    buttons.forEach(function(button) {
        button.addEventListener("click", function(event) {
            event.stopPropagation();
            var contents = document.querySelectorAll('.dropdown-content');
            contents.forEach(function(content) {
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
            dropdownContainer.addEventListener("mouseenter", function() {
                var content = button.nextElementSibling;
                if (dropdownContainer.dataset.clickOpen !== "true") {
                    content.style.display = "block";
                }
            });
            dropdownContainer.addEventListener("mouseleave", function() {
                var content = button.nextElementSibling;
                if (dropdownContainer.dataset.clickOpen !== "true") {
                    content.style.display = "none";
                }
            });
        }
    });

    document.addEventListener("click", function(event) {
        var dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(function(dropdown) {
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
        searchInput.addEventListener("keypress", function(event) {
            if (event.key === "Enter") fetchProducts();
        });
    } else {
        console.error("Search input not found in DOM!");
    }

    var sortSelect = document.querySelector("#sort");
    if (sortSelect) sortSelect.addEventListener("change", fetchProducts);

    var priceRangeSelect = document.querySelector("#price-range");
    if (priceRangeSelect) priceRangeSelect.addEventListener("change", fetchProducts);

    var checkboxes = document.querySelectorAll(".dropdown-content input");
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener("change", fetchProducts);
    });

    var currencyDropdown = document.querySelector("#currency-dropdown");
    if (currencyDropdown) {
        currencyDropdown.addEventListener("change", function () {
            window.currencyConverter.setCurrentCurrency(currencyDropdown.value);
            filterAndDisplayProducts(currentProducts);
        });
    }

    var savePreferencesButton = document.querySelector("#save-preferences");
    if (savePreferencesButton) {
        savePreferencesButton.addEventListener("click", savePreferences);
    }

    var resetPreferencesButton = document.querySelector("#reset-preferences");
    if (resetPreferencesButton) {
        resetPreferencesButton.addEventListener("click", resetPreferences);
    } else {
        console.error("Reset preferences button not found in DOM!");
    }

    // Listen for currency changes triggered by other scripts
    window.addEventListener('currencyChanged', function() {
        filterAndDisplayProducts(currentProducts);
    });
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/u22747363/api.php", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            try {
                // First check if the response is valid JSON
                var contentType = xhr.getResponseHeader('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                    var data = JSON.parse(xhr.responseText);
                    console.log("API Response:", JSON.stringify(data, null, 2));
                    
                    if (xhr.status >= 200 && xhr.status < 300) {
                        if (data.status === "success") {
                            resolve(data.data || []);
                        } else {
                            console.error("API Error:", data.message);
                            if (data.message === "Invalid API key") {
                                alert("Your session has expired. Please log in again.");
                                localStorage.removeItem("apikey");
                                window.location.href = 'login.php';
                            }
                            reject(new Error(data.message || "API returned error status"));
                        }
                    } else {
                        console.error("API HTTP Error:", xhr.status, data.message || xhr.statusText);
                        reject(new Error(data.message || `HTTP error ${xhr.status}`));
                    }
                } else {
                    // Handle non-JSON response (likely an error)
                    console.error("Non-JSON response received:", {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        contentType: contentType
                    });
                    
                    if (xhr.status === 0) {
                        reject(new Error("Network error - could not connect to server"));
                    } else if (xhr.status === 401) {
                        alert("Unauthorized access. Please log in again.");
                        localStorage.removeItem("apikey");
                        window.location.href = 'login.php';
                        reject(new Error("Unauthorized"));
                    } else {
                        reject(new Error(`Server returned non-JSON response (${xhr.status} ${xhr.statusText})`));
                    }
                }
            } catch (e) {
                console.error("Error parsing API response:", {
                    error: e,
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
                reject(new Error("Failed to parse server response"));
            }
        };

        xhr.onerror = function() {
            console.error("Network Error:", xhr.statusText);
            reject(new Error(xhr.statusText || "Network request failed"));
        };

        xhr.ontimeout = function() {
            console.error("Request timed out");
            reject(new Error("Request timed out"));
        };

        try {
            console.log("Sending API request:", JSON.stringify(requestBody, null, 2));
            xhr.send(JSON.stringify(requestBody));
        } catch (e) {
            console.error("Error sending request:", e);
            reject(new Error("Failed to send request"));
        }
    }).catch(function(error) {
        console.error("API Call Error:", error);
        throw error; // Re-throw to allow further error handling
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

    var requestBody = {
        type: "GetAllProducts",
        apikey: localStorage.getItem("apikey") || window.userApiKey,
        sort: sortValue.split('-')[0],
        order: sortValue.split('-')[1].toUpperCase(),
        return: ["id", "title", "brand", "final_price", "image_url", "categories", "department", "country_of_origin"],
        limit: 250,
        fuzzy: true
    };

    if (Object.keys(search).length > 0) {
        requestBody.search = search;
    }

    if (priceRange !== "all") {
        requestBody.search = requestBody.search || {};
        requestBody.search.pricemax = parseFloat(priceRange);
        console.log("Applied price filter: Max price =", priceRange, "ZAR");
    }

    if (searchQuery) {
        var searchPromises = [];
        var fieldRequestBody = JSON.parse(JSON.stringify(requestBody));
        fieldRequestBody.search = fieldRequestBody.search || {};
        fieldRequestBody.search.title = searchQuery;
        searchPromises.push(makeApiCall(fieldRequestBody));

        Promise.all(searchPromises)
            .then(function(allResults) {
                var combinedProducts = [];
                var seenIds = {};

                allResults.forEach(function(products) {
                    products.forEach(function(product) {
                        if (!seenIds[product.id]) {
                            seenIds[product.id] = true;
                            combinedProducts.push(product);
                        }
                    });
                });

                currentProducts = combinedProducts;
                filterAndDisplayProducts(combinedProducts);
                hideMainLoader();
            })
            .catch(function(error) {
                console.error("Error fetching products:", error);
                displayNoResults();
                hideMainLoader();
            });
    } else {
        console.log("Sending API request:", JSON.stringify(requestBody));
        makeApiCall(requestBody).then(function(products) {
            console.log("Products received:", products.length);
            if (products.length === 0) {
                console.log("No products returned from API. Displaying fallback message.");
                displayNoResults();
                return;
            }
            currentProducts = products;
            filterAndDisplayProducts(products);
        }).catch(function(error) {
            console.error("Error fetching products:", error);
            displayNoResults();
        }).finally(function() {
            hideMainLoader();
        });
    }
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

    products.forEach(function(product) {
        var productCard = document.createElement("div");
        productCard.classList.add("product");
        productCard.dataset.productId = product.id; // Add product ID as data attribute

        var title = sanitizeInput(product.title || "No Title Available");
        var brand = sanitizeInput(product.brand || "Unknown Brand");
        var finalPrice = parseFloat(product.final_price) || 0;
        var finalPriceConverted = window.currencyConverter.convertPrice(finalPrice, "ZAR", selectedCurrency);
        var price = finalPriceConverted.toFixed(2) + " " + selectedCurrency;
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
            '<p>Price: ' + price + '</p>',
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

        img.onload = function() {
            loader.style.display = "none";
            checkAllImagesLoaded();
        };

        img.onerror = function() {
            loader.style.display = "none";
            img.src = "default-image.jpg";
            checkAllImagesLoaded();
        };
    });
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-wishlist')) {
        const productCard = event.target.closest('.product');
        const productId = productCard.dataset.productId;
        addToWishlist(productId, event.target);
    }
});

function addToWishlist(productId, button) {
    // Check if user is logged in
    if (!window.userApiKey) {
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
        apikey: window.userApiKey,
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

// Add event listener for "Add to Cart" button clicks
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('add-to-cart')) {
        const productCard = event.target.closest('.product');
        const productId = productCard.dataset.productId;
        addToCart(productId, event.target);
    }
});

// Function to handle adding a product to the cart
function addToCart(productId, button) {
    // Check if user is logged in
    const apiKey = localStorage.getItem("apikey") || window.userApiKey;
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
        productContainer.innerHTML = '<p class="no-results">No products found. Please try different search or filter criteria.</p>';
    }
    hideMainLoader();
}

document.addEventListener("click", function(event) {
    if (!event.target.matches('.dropdown-btn')) {
        var dropdowns = document.querySelectorAll('.dropdown-content');
        dropdowns.forEach(function(dropdown) {
            if (dropdown.style.display === 'block' && !dropdown.contains(event.target)) {
                dropdown.style.display = 'none';
            }
        });
    }
});