var currencyRates = {};
var currentCurrency = 'ZAR';

function fetchCurrencyRates() {
    var requestBody = {
        studentnum: "u22747363",
        apikey: "ae575ccbd3973ae1ac92ea4ec40f8b43",
        type: "GetCurrencyList"
    };

    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://wheatley.cs.up.ac.za/api/", true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                var response = JSON.parse(xhr.responseText);
                if (response.data) {
                    currencyRates = response.data;
                    resolve(response.data);
                } else {
                    console.error("No currency data in response:", response);
                    reject(new Error("No currency data in response"));
                }
            } else {
                console.error("HTTP error " + xhr.status + ":", xhr.statusText);
                reject(new Error("HTTP error " + xhr.status));
            }
        };

        xhr.onerror = function() {
            console.error("Network error fetching currency rates:", xhr.statusText);
            reject(new Error("Network error"));
        };

        xhr.send(JSON.stringify(requestBody));
    }).catch(function(error) {
        console.error("Error fetching currency rates:", error);
        throw error;
    });
}

function populateCurrencyDropdown() {
    var dropdown = document.getElementById('currency-dropdown');
    if (!dropdown) {
        console.warn("Currency dropdown not found");
        return;
    }

    dropdown.innerHTML = '<option value="ZAR">ZAR - South African Rand</option>';
    fetchCurrencyRates().then(function(rates) {
        for (var currency in rates) {
            if (rates.hasOwnProperty(currency) && currency !== 'ZAR') {
                var option = document.createElement('option');
                option.value = currency;
                option.textContent = currency + " - " + getCurrencyFullName(currency);
                dropdown.appendChild(option);
            }
        }
        dropdown.value = currentCurrency;
        dropdown.addEventListener('change', handleCurrencyChange);
    }).catch(function(error) {
        console.error("Failed to populate currency dropdown:", error);
    });
}

function getCurrencyFullName(code) {
    var currencyNames = {
        'USD': 'US Dollar',
        'EUR': 'Euro',
        'GBP': 'British Pound',
        'JPY': 'Japanese Yen',
        'CAD': 'Canadian Dollar',
        'AUD': 'Australian Dollar',
        'CHF': 'Swiss Franc',
        'CNY': 'Chinese Yuan',
        'INR': 'Indian Rupee',
        'ZAR': 'South African Rand',
        'TRY': 'Turkish Lira',
        'HKD': 'Hong Kong Dollar',
        'SGD': 'Singapore Dollar',
        'SEK': 'Swedish Krona',
        'NOK': 'Norwegian Krone',
        'DKK': 'Danish Krone',
        'BRL': 'Brazilian Real',
        'MXN': 'Mexican Peso',
        'PLN': 'Polish Złoty',
        'RUB': 'Russian Ruble'
    };
    return currencyNames[code] || code;
}

function convertPrice(price, sourceCurrency, targetCurrency) {
    sourceCurrency = sourceCurrency || "USD";
    targetCurrency = targetCurrency || "USD";
    
    if (!currencyRates[sourceCurrency] || !currencyRates[targetCurrency]) {
        console.warn("Currency rates not available for " + sourceCurrency + " to " + targetCurrency);
        return price;
    }
    var priceInUSD = price / currencyRates[sourceCurrency];
    return priceInUSD * currencyRates[targetCurrency];
}

function handleCurrencyChange(event) {
    currentCurrency = event.target.value;
    updateAllProductPrices(currentCurrency);
}

function updateAllProductPrices(newCurrency) {
    var productCards = document.querySelectorAll('.product');
    productCards.forEach(function(card) {
        var priceElement = card.querySelector('p:nth-of-type(2)');
        if (priceElement) {
            var originalPrice = parseFloat(priceElement.dataset.originalPrice);
            var originalCurrency = priceElement.dataset.originalCurrency;
            var convertedPrice = convertPrice(originalPrice, originalCurrency, newCurrency);
            priceElement.textContent = "Price: " + convertedPrice.toFixed(2) + " " + newCurrency;
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    populateCurrencyDropdown();
});

window.currencyConverter = {
    convertPrice: convertPrice,
    getCurrentCurrency: function() { return currentCurrency; },
    setCurrentCurrency: function(currency) { currentCurrency = currency; },
    getRates: function() { return currencyRates; },
    fetchRates: fetchCurrencyRates
};