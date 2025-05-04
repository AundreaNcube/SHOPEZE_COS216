
console.log("Hieeee");
document.addEventListener("DOMContentLoaded", function() {
    // Check if user is logged in
    if (!window.userApiKey) {
        console.error("User API key not found. Please log in.");
        alert("Please log in to view products.");
        window.location.href = 'login.php';
        return;
    }

    showMainLoader();
    Promise.all([
        fetchDistinct("department"), // Using 'department' instead of 'categories' to match DB
        fetchDistinct("brand"),
        fetchDistinct("country_of_origin")
    ]).then(function(results) {
        var departments = results[0];
        var brands = results[1];
        var countries = results[2];

        populateFilterOptions("category-options", departments); // Rename to department-options in HTML if needed
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

function fetchDistinct(field) {
    var requestBody = {
        type: "GetAllProducts",
        apikey: window.userApiKey,
        return: [field],
        limit: 20,
        fuzzy: false
    };

    return makeApiCall(requestBody).then(function(products) {
        // Extract unique values from the specified field
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
    }else {
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

}


function makeApiCall(requestBody) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/u22747363/api.php", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var data = JSON.parse(xhr.responseText);
                console.log("API Response:", JSON.stringify(data, null, 2)); // More detailed logging
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
        apikey: window.userApiKey,
        sort: sortValue.split('-')[0],
        order: sortValue.split('-')[1].toUpperCase(),
        return: ["id", "title", "brand", "final_price", "image_url", "categories", "department", "country_of_origin"],
        limit: 500,
        fuzzy: true
    };

    // Set the search parameters
    if (Object.keys(search).length > 0) {
        requestBody.search = search;
    }

    // Handle price range filter
    if (priceRange !== "all") {
        requestBody.search = requestBody.search || {};
        requestBody.search.pricemax = parseFloat(priceRange);
        console.log("Applied price filter: Max price =", priceRange, "ZAR");
    }

    // Handle search query
    if (searchQuery) {
        var searchPromises = [];
        
        // Create a request for title search
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
        // Non-search requests
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
    displayProducts(products);
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

    var totalImages = products.length;
    var loadedImages = 0;

    products.forEach(function(product) {
        var productCard = document.createElement("div");
        productCard.classList.add("product");

        var title = product.title || "No Title Available";
        var brand = product.brand || "Unknown Brand";
        var price = (parseFloat(product.final_price) || 0).toFixed(2) + " ZAR"; // Prices are in ZAR from API
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