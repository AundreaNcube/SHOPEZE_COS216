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
                console.log("Currency API full response:", JSON.stringify(response, null, 2));
                // Check for data presence instead of status, as API may not return status
                if (response.data && typeof response.data === "object" && response.data !== null) {
                    var rates = response.data.rates || response.data; // Handle nested rates or flat data
                    if (typeof rates === "object" && rates !== null) {
                        currencyRates = rates;
                        console.log("Currency rates loaded:", currencyRates);
                        resolve(rates);
                    } else {
                        console.error("Unexpected currency data format:", response.data);
                        reject(new Error("Unexpected currency data format"));
                    }
                } else {
                    console.error("No valid currency data in response:", response);
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
        console.log("Populating dropdown with rates:", rates);
        for (var currency in rates) {
            if (rates.hasOwnProperty(currency) && currency !== 'ZAR') {
                var option = document.createElement('option');
                option.value = currency;
                option.textContent = currency + " - " + getCurrencyFullName(currency);
                dropdown.appendChild(option);
            }
        }
        dropdown.value = currentCurrency;
    }).catch(function(error) {
        console.error("Failed to populate currency dropdown:", error);
        dropdown.innerHTML = '<option value="ZAR">ZAR - South African Rand</option>';
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
    sourceCurrency = sourceCurrency || "ZAR";
    targetCurrency = targetCurrency || "ZAR";

    if (sourceCurrency === targetCurrency) {
        return price; // No conversion needed for same currency
    }

    if (!currencyRates[sourceCurrency] || !currencyRates[targetCurrency]) {
        console.warn("Currency rates not available for " + sourceCurrency + " to " + targetCurrency + ", using raw price");
        return price;
    }
    var priceInUSD = price / currencyRates[sourceCurrency];
    return priceInUSD * currencyRates[targetCurrency];
}

window.currencyConverter = {
    convertPrice: convertPrice,
    getCurrentCurrency: function() { return currentCurrency; },
    setCurrentCurrency: function(currency) { currentCurrency = currency; },
    getRates: function() { return currencyRates; },
    fetchRates: fetchCurrencyRates
};

document.addEventListener('DOMContentLoaded', function() {
    populateCurrencyDropdown();
});