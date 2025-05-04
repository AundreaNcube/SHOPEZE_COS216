var countries = [
  { name: "Canada", code: "CA" },
  { name: "China", code: "CN" },
  { name: "El Salvador", code: "SV" },
  { name: "France", code: "FR" },
  { name: "Germany", code: "DE" },
  { name: "Hong Kong", code: "HKG" },
  { name: "India", code: "IN" },
  { name: "Indonesia", code: "ID" },
  { name: "Ireland", code: "IE" },
  { name: "Japan", code: "JP" },
  { name: "Malaysia", code: "MY" },
  { name: "Mexico", code: "MX" },
  { name: "Korea", code: "KOR" },
  { name: "Philippines", code: "PH" },
  { name: "Sri Lanka", code: "LK" },
  { name: "Taiwan", code: "TW" },
  { name: "Thailand", code: "TH" },
  { name: "United Kingdom", code: "GB" },
  { name: "United States", code: "US" },
  { name: "Vietnam", code: "VN" },
];

var countryCodeMap = {};

for (var i = 0; i < countries.length; i++) {
  var country = countries[i];
  countryCodeMap[country.name.toLowerCase()] = country.code;
}

function getCountryCode(countryName) {
  if (!countryName) return null;
  var normalizedName = countryName.toLowerCase();
  return countryCodeMap[normalizedName] || null;
}

window.getCountryCode = getCountryCode;

