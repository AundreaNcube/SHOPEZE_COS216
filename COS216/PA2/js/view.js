document.addEventListener("DOMContentLoaded", function() {
    var urlParams = new URLSearchParams(window.location.search);
    var productId = urlParams.get("id");

    if (productId) {
        fetchProductDetails(productId);
    } else {
        document.querySelector(".product-details").innerHTML = "<p>No product ID provided.</p>";
    }
});

function fetchProductDetails(productId) {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetAllProducts",
        search: { "id": productId },
        return: [
            "id", "title", "brand", "description", "initial_price", "final_price",
            "currency", "categories", "image_url", "images", "features",
            "is_available", "country_of_origin", "manufacturer", "department",
            "product_dimensions", "date_first_available"
        ],
        limit: 1,
        sort: "id",
        order: "ASC"
    };

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
        console.log("HTTP Status:", xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                var response = JSON.parse(xhr.responseText);
                if (response.status === "success" && response.data.length > 0) {
                    var product = response.data[0];
                    displayProductDetails(product);
                } else {
                    document.querySelector(".product-details").innerHTML = "<p>Product not found.</p>";
                }
            } catch (e) {
                console.error("JSON Parse Error:", e.message);
                document.querySelector(".product-details").innerHTML = "<p>Invalid response from server: " + xhr.responseText + "</p>";
            }
        } else {
            console.error("HTTP Error:", xhr.status, xhr.responseText);
            document.querySelector(".product-details").innerHTML = "<p>Error fetching product details: " + xhr.responseText + "</p>";
        }
    };

    xhr.onerror = function () {
        console.error("Network Error:", xhr.statusText);
        document.querySelector(".product-details").innerHTML = "<p>Network error fetching product details.</p>";
    };

    xhr.send(JSON.stringify(requestBody));
}

var currentImageIndex = 0;
var allImages = [];

function displayProductDetails(product) {
    function setTextContent(id, content) {
        var element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        } else {
            console.error("Element with ID '" + id + "' not found in the HTML.");
        }
    }

    var categories = typeof product.categories === "string" ? JSON.parse(product.categories) : product.categories || [];
    var images = typeof product.images === "string" ? JSON.parse(product.images) : product.images || [];
    var features = typeof product.features === "string" ? JSON.parse(product.features) : product.features || [];

    setTextContent("product-title", product.title || "No Title Available");
    setTextContent("product-price", product.final_price ? product.final_price + " " + product.currency : "Price Not Available");
    setTextContent("product-category", categories.join(", ") || "N/A");
    setTextContent("product-availability", product.is_available !== undefined ? (product.is_available ? "In Stock" : "Out of Stock") : "N/A");
    setTextContent("product-description", product.description || "No description available.");

    var featuresList = document.getElementById("product-features");
    if (featuresList) {
        featuresList.innerHTML = "";
        if (Array.isArray(features) && features.length > 0) {
            features.forEach(function(feature) {
                var li = document.createElement("li");
                li.textContent = feature;
                featuresList.appendChild(li);
            });
        } else {
            featuresList.innerHTML = "<li>No features available.</li>";
        }
    }

    var mainImage = document.getElementById("main-image");
    var thumbnailContainer = document.getElementById("thumbnail-container");
    if (mainImage && thumbnailContainer) {
        allImages = [product.image_url].concat(images);
        if (allImages.length > 0) {
            mainImage.src = allImages[0] || "default-image.jpg";
            currentImageIndex = 0;
        } else {
            mainImage.src = "default-image.jpg";
        }

        thumbnailContainer.innerHTML = "";
        allImages.forEach(function(imgUrl, index) {
            var thumbnail = document.createElement("img");
            thumbnail.className = "thumbnail";  
            thumbnail.src = imgUrl || "default-image.jpg";
            thumbnail.alt = "Thumbnail " + (index + 1);
            thumbnail.addEventListener("click", function() {
                mainImage.src = imgUrl;
                currentImageIndex = index;
            });
            thumbnailContainer.appendChild(thumbnail);
        });
    }

    var additionalAttributesList = document.getElementById("additional-attributes");
    if (additionalAttributesList) {
        additionalAttributesList.innerHTML = "";
        var additionalFields = {
            "Brand": product.brand,
            "Initial Price": product.initial_price ? product.initial_price + " " + product.currency : null,
            "Country of Origin": product.country_of_origin,
            "Manufacturer": product.manufacturer,
            "Department": product.department,
            "Product Dimensions": product.product_dimensions,
            "Date First Available": product.date_first_available
        };

        Object.keys(additionalFields).forEach(function(key) {
            var value = additionalFields[key];
            if (value) {
                var li = document.createElement("li");
                if (key === "Country of Origin") {
                    var countryCode = getCountryCode(value);
                    var flagUrl = countryCode ? "https://flagsapi.com/" + countryCode + "/flat/64.png" : "";
                    li.innerHTML = [
                        "<strong>" + key + ":</strong>",
                        flagUrl ? '<img src="' + flagUrl + '" alt="' + value + ' flag" class="flag">' : "",
                        value
                    ].join(" ");
                } else {
                    li.innerHTML = "<strong>" + key + ":</strong> " + value;
                }
                additionalAttributesList.appendChild(li);
            }
        });
    }

    document.getElementById("prev-btn").addEventListener("click", function() {
        if (allImages.length > 0) {
            currentImageIndex = (currentImageIndex - 1 + allImages.length) % allImages.length;
            mainImage.src = allImages[currentImageIndex];
        }
    });

    document.getElementById("next-btn").addEventListener("click", function() {
        if (allImages.length > 0) {
            currentImageIndex = (currentImageIndex + 1) % allImages.length;
            mainImage.src = allImages[currentImageIndex];
        }
    });
}