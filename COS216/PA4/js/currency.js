var currencyRates = {};
var currentCurrency = localStorage.getItem("currency") || 'ZAR';

window.currencyConverter = {
    fetchRates: function() {
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
                    if (response.data && typeof response.data === "object" && response.data !== null) {
                        var rates = response.data.rates || response.data;
                        if (typeof rates === "object" && rates !== null) {
                            currencyRates = rates;
                            console.log("Currency rates loaded:", currencyRates);
                            resolve(rates);
                        } else {
                            console.error("Unexpected currency data format:", response.data);
                            reject(new Error("Unexpected currency data format"));
                            currencyRates = { USD: 1, ZAR: 18.4380836589, CNY: 7.3026009457 };
                            resolve(currencyRates);
                        }
                    } else {
                        console.error("No valid currency data in response:", response);
                        reject(new Error("No currency data in response"));
                        currencyRates = { USD: 1, ZAR: 18.4380836589, CNY: 7.3026009457 };
                        resolve(currencyRates);
                    }
                } else {
                    console.error("HTTP error " + xhr.status + ":", xhr.statusText);
                    reject(new Error("HTTP error " + xhr.status));
                    currencyRates = { USD: 1, ZAR: 18.4380836589, CNY: 7.3026009457 };
                    resolve(currencyRates);
                }
            };

            xhr.onerror = function() {
                console.error("Network error fetching currency rates:", xhr.statusText);
                reject(new Error("Network error"));
                currencyRates = { USD: 1, ZAR: 18.4380836589, CNY: 7.3026009457 };
                resolve(currencyRates);
            };

            xhr.send(JSON.stringify(requestBody));
        });
    },

    populateCurrencyDropdown: function() {
        var dropdown = document.getElementById('currency-dropdown');
        if (!dropdown) {
            console.warn("Currency dropdown not found");
            return;
        }

        dropdown.innerHTML = '<option value="ZAR">ZAR - South African Rand</option>';
        this.fetchRates().then(function(rates) {
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
            dropdown.addEventListener('change', function() {
                currentCurrency = this.value;
                localStorage.setItem("currency", currentCurrency);
                window.dispatchEvent(new Event('currencyChanged'));
            });
        }).catch(function(error) {
            console.error("Failed to populate currency dropdown:", error);
            dropdown.innerHTML = '<option value="ZAR">ZAR - South African Rand</option>';
            dropdown.value = currentCurrency;
            dropdown.addEventListener('change', function() {
                currentCurrency = this.value;
                localStorage.setItem("currency", currentCurrency);
                window.dispatchEvent(new Event('currencyChanged'));
            });
        });
    },

    setCurrentCurrency: function(currency) {
        currentCurrency = currency;
        localStorage.setItem("currency", currentCurrency);
        window.dispatchEvent(new Event('currencyChanged'));
    },

    getCurrentCurrency: function() {
        return currentCurrency;
    },

    convertPrice: function(price, fromCurrency, toCurrency) {
        if (!currencyRates[fromCurrency] || !currencyRates[toCurrency]) {
            console.warn("Currency rate not found for " + fromCurrency + " or " + toCurrency + ", using 1:1 conversion");
            return price;
        }
        var usdPrice = price / currencyRates[fromCurrency];
        return Math.round(usdPrice * currencyRates[toCurrency] * 100) / 100;
    }
};

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

document.addEventListener('DOMContentLoaded', function() {
    window.currencyConverter.populateCurrencyDropdown();
});