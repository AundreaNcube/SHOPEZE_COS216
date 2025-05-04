document.addEventListener("DOMContentLoaded", function () {
    showMainLoader();
    window.currencyConverter.fetchRates().then(function () {
        Promise.all([
            fetchDepartments(),
            fetchDistinct("brand"),
            fetchDistinct("country_of_origin")
        ]).then(function (results) {
            populateFilterOptions("category-options", results[0]);
            populateFilterOptions("brand-options", results[1]);
            populateFilterOptions("country-options", results[2]);
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
        limit: 25
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
        console.error("Container not found:", id);
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
    buttons.forEach(function(button) {
        button.addEventListener("click", function() {
            var content = button.nextElementSibling;
            content.style.display = content.style.display === "block" ? "none" : "block";
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
        checkbox.addEventListener("change", fetchProducts);
    });
    var currencyDropdown = document.querySelector("#currency-dropdown");
    if (currencyDropdown) {
        currencyDropdown.addEventListener("change", function() {
            var newCurrency = currencyDropdown.value;
            window.currencyConverter.setCurrentCurrency(newCurrency);
            var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "price-asc";
            sortProducts(currentProducts, sortValue, newCurrency);
            var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";
            filterAndDisplayProducts(currentProducts, priceRange);
        });
    } else {
        console.log("Currency dropdown not found");
    }

    //==============
}

function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
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
        xhr.onerror = function () {
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
    var sortValue = document.querySelector("#sort") ? document.querySelector("#sort").value : "price-asc";
    var priceRange = document.querySelector("#price-range") ? document.querySelector("#price-range").value : "all";
    var selectedCurrency = document.querySelector("#currency-dropdown") ? document.querySelector("#currency-dropdown").value : 'ZAR';
    
    var selectedCategories = Array.prototype.slice.call(document.querySelectorAll('input[name="category"]:checked')).map(function(cb) { return cb.value; });
    var selectedBrands = Array.prototype.slice.call(document.querySelectorAll('input[name="brand"]:checked')).map(function(cb) { return cb.value; });
    var selectedCountries = Array.prototype.slice.call(document.querySelectorAll('input[name="country"]:checked')).map(function(cb) { return cb.value; });

    var baseSearch = {};
    if (selectedCategories.length > 0) baseSearch.categories = selectedCategories.join(",");
    if (selectedBrands.length > 0) baseSearch.brand = selectedBrands.join(",");
    if (selectedCountries.length > 0) baseSearch.country_of_origin = selectedCountries.join(",");

    var baseRequestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllProducts",
        sort: "final_price",
        order: sortValue === "price-asc" ? "ASC" : "DESC",
        return: ["id", "title", "brand", "initial_price", "final_price", "currency", "image_url", "categories", "country_of_origin"],
        limit: 400 
    };

    if (!searchQuery) {
        if (Object.keys(baseSearch).length > 0) {
            baseRequestBody.search = baseSearch;
        }
        
        makeApiCall(baseRequestBody)
            .then(processDealsProducts)
            .catch(function(error) {
                console.error("Error fetching products:", error);
                displayNoResults();
                hideMainLoader();
            });
    } else {
        var searchPromises = [];
        var searchFields = ['title', 'brand', 'description', 'categories', 'manufacturer', 'department', 'features', 'country_of_origin'];
        
        searchFields.forEach(function(field) {
            var fieldRequestBody = JSON.parse(JSON.stringify(baseRequestBody));
            
            var fieldSearch = Object.assign({}, baseSearch);
            fieldSearch[field] = searchQuery;
            fieldRequestBody.search = fieldSearch;
            
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
                
                processDealsProducts(combinedProducts);
            })
            .catch(function(error) {
                console.error("Error fetching products:", error);
                displayNoResults();
                hideMainLoader();
            });
    }

    function processDealsProducts(products) {
        products = products.filter(function(product) {
            return calculateDiscountPercentage(product.initial_price, product.final_price) >= 10;
        });
        
        sortProducts(products, sortValue, selectedCurrency);
        currentProducts = products;
        
        filterAndDisplayProducts(products, priceRange);
    }
}

function sortProducts(products, sortValue, currency) {
    if (sortValue === "price-asc") {
        products.sort(function(a, b) {
            var priceA = window.currencyConverter.convertPrice(parseFloat(a.final_price) || 0, a.currency || "USD", currency);
            var priceB = window.currencyConverter.convertPrice(parseFloat(b.final_price) || 0, b.currency || "USD", currency);
            return priceA - priceB;
        });
    } else if (sortValue === "price-desc") {
        products.sort(function(a, b) {
            var priceA = window.currencyConverter.convertPrice(parseFloat(a.final_price) || 0, a.currency || "USD", currency);
            var priceB = window.currencyConverter.convertPrice(parseFloat(b.final_price) || 0, b.currency || "USD", currency);
            return priceB - priceA;
        });
    } else if (sortValue === "discount-asc") {
        products.sort(function(a, b) {
            var discountA = calculateDiscountPercentage(a.initial_price, a.final_price);
            var discountB = calculateDiscountPercentage(b.initial_price, b.final_price);
            return discountA - discountB;
        });
    } else if (sortValue === "discount-desc") {
        products.sort(function(a, b) {
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

function filterAndDisplayProducts(products, priceRange) {
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
        var initialPrice = parseFloat(product.initial_price) || 0;
        var finalPrice = parseFloat(product.final_price) || 0;
        var originalCurrency = product.currency || "USD";
        var initialPriceConverted = window.currencyConverter.convertPrice(initialPrice, originalCurrency, selectedCurrency);
        var finalPriceConverted = window.currencyConverter.convertPrice(finalPrice, originalCurrency, selectedCurrency);
        var initialPriceDisplay = initialPriceConverted && initialPrice > 0 ? '<span class="strikethrough">' + initialPriceConverted.toFixed(2) + " " + selectedCurrency + '</span>' : "N/A";
        var finalPriceDisplay = finalPriceConverted && finalPrice > 0 ? finalPriceConverted.toFixed(2) + " " + selectedCurrency : "Price Not Available";
        var discountPercentage = calculateDiscountPercentage(product.initial_price, product.final_price).toFixed(2);
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
            '<p><s>' + initialPriceDisplay + '</s></p>',
            '<p>' + finalPriceDisplay + '</p>',
            '<p>Discount: ' + discountPercentage + '%</p>',
            '<a href="view.html?id=' + productId + '" class="more-info">More Information</a>',
            '<button class="Add-to add-to-cart">Add to Cart</button>',
            '<button class="Add-to add-to-wishlist">Add to Wishlist</button>',
            '</div>'
        ].join("");
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
        productContainer.innerHTML = "<p class='no-results'>No deals found. Please try different search or filter criteria.</p>";
    }
    hideMainLoader();
}

document.addEventListener("click", function (event) {
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