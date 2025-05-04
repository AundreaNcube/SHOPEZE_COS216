/**
 * ASYNCHRONOUS CALLS
 * I chose asynchronous calls for these reasons
 * 1. Asynchronous calls allow the page to remain interactive while waiting for API
 *      responses. For example, users can still click 
 *      filters or change currency in deals.js without the page freezing
 * 
 * 2. Prevents Blocking : Asynchronous calls let other scripts run concurrently.
 */

document.addEventListener("DOMContentLoaded", function() {
    showMainLoader();
    window.currencyConverter.fetchRates().then(function() {
        Promise.all([
            fetchDepartments(),
            fetchDistinct("brand"),
            fetchDistinct("country_of_origin")
        ]).then(function(results) {
            var categories = results[0];
            var brands = results[1];
            var countries = results[2];

            populateFilterOptions("category-options", categories);
            populateFilterOptions("brand-options", brands);
            populateFilterOptions("country-options", countries);

            setupEventListeners();
            fetchProducts();
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

function fetchDepartments() {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllDepartments",
        limit: 20
    };

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                if (data.status === "success") {
                    resolve(data.data);
                } else {
                    console.error("Error fetching departments:", data.message);
                    resolve([]);
                }
            } else {
                console.error("Error fetching departments:", xhr.statusText);
                reject(new Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            console.error("Error fetching departments:", xhr.statusText);
            reject(new Error(xhr.statusText));
        };

        xhr.send(JSON.stringify(requestBody));
    }).catch(function(error) {
        console.error("Error fetching departments:", error);
        return [];
    });
}

function fetchDistinct(field) {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetDistinct",
        field: field,
        limit: 20
    };

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                if (data.status === "success") {
                    resolve(data.data);
                } else {
                    console.error("Error fetching distinct " + field + ":", data.message);
                    resolve([]);
                }
            } else {
                console.error("Error fetching distinct " + field + ":", xhr.statusText);
                reject(new Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            console.error("Error fetching distinct " + field + ":", xhr.statusText);
            reject(new Error(xhr.statusText));
        };

        xhr.send(JSON.stringify(requestBody));
    }).catch(function(error) {
        console.error("Error fetching distinct " + field + ":", error);
        return [];
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
            if (dropdown.style.display === 'block') {
                var button = dropdown.previousElementSibling;
                if (!dropdown.contains(event.target) && button !== event.target) {
                    dropdown.style.display = 'none';
                    if (dropdown.closest('.dropdown')) {
                        dropdown.closest('.dropdown').dataset.clickOpen = "false";
                    }
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
    }

    var sortSelect = document.querySelector("#sort");
    if (sortSelect) sortSelect.addEventListener("change", fetchProducts);

    var priceRangeSelect = document.querySelector("#price-range");
    if (priceRangeSelect) priceRangeSelect.addEventListener("change", fetchProducts);

    var checkboxes = document.querySelectorAll(".dropdown-content input");
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener("change", function(event) {
            event.stopPropagation();
            fetchProducts();
        });
    });

    var currencyDropdown = document.querySelector("#currency-dropdown");
    if (currencyDropdown) {
        currencyDropdown.addEventListener("change", function() {
            var newCurrency = currencyDropdown.value;
            window.currencyConverter.setCurrentCurrency(newCurrency);
            updateProductDisplay();
        });
    } else {
        console.warn("Currency dropdown not found");
    }
}

function updateProductDisplay() {
    var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "price-asc";
    var newCurrency = document.querySelector("#currency-dropdown") ? document.querySelector("#currency-dropdown").value : 'ZAR';

    if (currentProducts && currentProducts.length > 0) {
        currentProducts.sort(function(a, b) {
            var priceA = window.currencyConverter.convertPrice(
                parseFloat(a.final_price) || 0,
                a.currency || "USD",
                newCurrency
            );
            var priceB = window.currencyConverter.convertPrice(
                parseFloat(b.final_price) || 0,
                b.currency || "USD",
                newCurrency
            );
            return sortValue === "price-asc" ? priceA - priceB : priceB - priceA;
        });

        var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";
        var searchQuery = document.querySelector(".search .input") ? document.querySelector(".search .input").value : "";
        filterAndDisplayProducts(currentProducts, priceRange, searchQuery);
    }
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                console.log("API Response:", data);
                if (data.status === "success") {
                    resolve(data.data || []);
                } else {
                    console.error("API Error:", data.message);
                    resolve([]);
                }
            } else {
                console.error("Fetch Error:", xhr.statusText);
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

function fetchProductsByBrand(brands) {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllProducts",
        search: { brand: brands.join(",") },
        sort: "final_price",
        order: "ASC",
        return: ["id", "title", "brand", "final_price", "currency", "image_url", "categories", "country_of_origin"],
        limit: 50
    };
    return makeApiCall(requestBody);
}

function fetchProductsByCountry(countries) {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllProducts",
        search: { country_of_origin: countries.join(",") },
        sort: "final_price",
        order: "ASC",
        return: ["id", "title", "brand", "final_price", "currency", "image_url", "categories", "country_of_origin"],
        limit: 50
    };
    return makeApiCall(requestBody);
}

function fetchProductsByCategory(categories) {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllProducts",
        search: { categories: categories.join(",") },
        sort: "final_price",
        order: "ASC",
        return: ["id", "title", "brand", "final_price", "currency", "image_url", "categories", "country_of_origin"],
        limit: 50
    };
    return makeApiCall(requestBody);
}

var currentProducts = [];

function fetchProducts() {
    showMainLoader();
    var searchQuery = document.querySelector(".search .input") ? document.querySelector(".search .input").value.trim() : "";
    var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "price-asc";
    var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";
    var selectedCurrency = document.querySelector("#currency-dropdown") ? document.querySelector("#currency-dropdown").value : 'ZAR';
    
    var selectedCategories = Array.prototype.slice.call(document.querySelectorAll('input[name="category"]:checked')).map(function(cb) { return cb.value; });
    var selectedBrands = Array.prototype.slice.call(document.querySelectorAll('input[name="brand"]:checked')).map(function(cb) { return cb.value; });
    var selectedCountries = Array.prototype.slice.call(document.querySelectorAll('input[name="country"]:checked')).map(function(cb) { return cb.value; });

    var search = {};

    if (selectedCategories.length > 0) {
        search.categories = selectedCategories.join(",");
    }

    if (selectedBrands.length > 0) {
        search.brand = selectedBrands.join(",");
    }

    if (selectedCountries.length > 0) {
        search.country_of_origin = selectedCountries.join(",");
    }

    if (searchQuery) {
        var searchPromises = [];
        var searchFields = ['title', 'brand', 'description', 'categories', 'manufacturer', 'department', 'features', 'country_of_origin'];
        
        // Create base request body
        var baseRequestBody = {
            studentnum: "u22747363",
            apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
            type: "GetAllProducts",
            sort: "final_price",
            order: sortValue === "price-asc" ? "ASC" : "DESC",
            return: ["id", "title", "brand", "final_price", "currency", "image_url", "categories", "country_of_origin"],
            limit: 50
        };
        
        if (Object.keys(search).length > 0) {
            baseRequestBody.search = Object.assign({}, search);
        }
        
        searchFields.forEach(function(field) {
            var fieldRequestBody = JSON.parse(JSON.stringify(baseRequestBody));
            if (!fieldRequestBody.search) fieldRequestBody.search = {};
            fieldRequestBody.search[field] = searchQuery;
            searchPromises.push(makeApiCall(fieldRequestBody));
        });
        
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
                
                
                combinedProducts.sort(function(a, b) {
                    var priceA = window.currencyConverter.convertPrice(
                        parseFloat(a.final_price) || 0,
                        a.currency || "USD",
                        selectedCurrency
                    );
                    var priceB = window.currencyConverter.convertPrice(
                        parseFloat(b.final_price) || 0,
                        b.currency || "USD",
                        selectedCurrency
                    );
                    return sortValue === "price-asc" ? priceA - priceB : priceB - priceA;
                });
                
                currentProducts = combinedProducts;
                filterAndDisplayProducts(combinedProducts, priceRange, searchQuery);
            })
            .catch(function(error) {
                console.error("Error fetching products:", error);
                displayNoResults();
                hideMainLoader();
            });
    } else {
        var requestBody = {
            studentnum: "u22747363",
            apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
            type: "GetAllProducts",
            sort: "final_price",
            order: sortValue === "price-asc" ? "ASC" : "DESC",
            return: ["id", "title", "brand", "final_price", "currency", "image_url", "categories", "country_of_origin"],
            limit: 50
        };

        if (Object.keys(search).length > 0) {
            requestBody.search = search;
        }

        console.log("Request Body:", JSON.stringify(requestBody));

        makeApiCall(requestBody).then(function(products) {
            console.log("Products received:", products.length);

            if (products.length === 0) {
                console.log("No products returned from API. Displaying fallback message.");
                displayNoResults();
                return;
            }

            products.sort(function(a, b) {
                var priceA = window.currencyConverter.convertPrice(
                    parseFloat(a.final_price) || 0,
                    a.currency || "USD",
                    selectedCurrency
                );
                var priceB = window.currencyConverter.convertPrice(
                    parseFloat(b.final_price) || 0,
                    b.currency || "USD",
                    selectedCurrency
                );
                return sortValue === "price-asc" ? priceA - priceB : priceB - priceA;
            });

            currentProducts = products;
            filterAndDisplayProducts(products, priceRange, searchQuery);
        }).catch(function(error) {
            console.error("Error fetching products:", error);
            displayNoResults();
            hideMainLoader();
        });
    }
}

function filterAndDisplayProducts(products, priceRange, searchQuery) {
    searchQuery = searchQuery;
    var filteredProducts = products;
    var selectedCurrency = document.querySelector("#currency-dropdown") ? document.querySelector("#currency-dropdown").value : 'ZAR';

    if (priceRange !== "all") {
        var maxPrice = Number(priceRange);
        filteredProducts = filteredProducts.filter(function(product) {
            var priceInSelectedCurrency = window.currencyConverter.convertPrice(
                parseFloat(product.final_price) || 0,
                product.currency || "USD",
                selectedCurrency
            );
            return priceInSelectedCurrency <= maxPrice;
        });
    }

    console.log("Filtered Products:", filteredProducts.length);
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

    var selectedCurrency = document.querySelector("#currency-dropdown") ? document.querySelector("#currency-dropdown").value : 'ZAR';
    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function(product) {
        var productCard = document.createElement("div");
        productCard.classList.add("product");

        var title = product.title || "No Title Available";
        var brand = product.brand || "Unknown Brand";
        var originalPrice = parseFloat(product.final_price) || 0;
        var originalCurrency = product.currency || "USD";
        var convertedPrice = window.currencyConverter.convertPrice(originalPrice, originalCurrency, selectedCurrency);
        var price = convertedPrice !== null && convertedPrice !== undefined ? convertedPrice.toFixed(2) + " " + selectedCurrency : "Price Not Available";
        var imageUrl = product.image_url || "default-image.jpg";
        var productId = product.id;

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
            '<p data-original-price="' + originalPrice + '" data-original-currency="' + originalCurrency + '">Price: ' + price + '</p>',
            '<a href="view.html?id=' + productId + '" class="more-info">More Information</a>',
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
            if (dropdown.style.display === 'block') {
                if (!dropdown.contains(event.target)) {
                    dropdown.style.display = 'none';
                }
            }
        });
    }
});