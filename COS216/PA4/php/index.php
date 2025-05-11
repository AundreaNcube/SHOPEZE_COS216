<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}
$userApiKey = $_SESSION['user']['api_key'] ?? '';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopEze - Products</title>
    <link rel="stylesheet" href="../css/products.css">
    <link rel="stylesheet" href="../css/filter.css">
    <link rel="stylesheet" href="../css/loader.css">
    <link rel="stylesheet" href="../css/theme.css">
    <link rel="stylesheet" href="../css/preferences.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="../js/currency.js" defer></script>
    <script src="../js/products.js" defer></script>
    <script src="../js/logout.js" defer></script>
    <script src="../js/theme.js" defer></script>
</head>

<body class="light-theme">
    <?php include 'header.php'; ?>

    <section class="filter-sort">
        <h6>.</h6>
        <div class="filters">
            <div class="filter-group">
                <label for="price-range">Price Range:</label>
                <select id="price-range" name="price-range">
                    <option value="all">All Prices</option>
                    <option value="500">Max: 500</option>
                    <option value="1500">Max: 1500</option>
                    <option value="5000">Max: 5000</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="category-dropdown" class="dropdown-label">Category:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="category-dropdown">Select Categories</button>
                    <div class="dropdown-content" id="category-options"></div>
                </div>
            </div>
            <div class="filter-group">
                <label for="brand-dropdown" class="dropdown-label">Brand:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="brand-dropdown">Select Brands</button>
                    <div class="dropdown-content" id="brand-options"></div>
                </div>
            </div>
            <div class="filter-group">
                <label for="country-dropdown" class="dropdown-label">Country of Origin:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="country-dropdown">Select Countries</button>
                    <div class="dropdown-content" id="country-options"></div>
                </div>
            </div>
            <div class="filter-group">
                <label for="currency-dropdown">Currency:</label>
                <select id="currency-dropdown" name="currency">
                    <!-- Populated by currency.js -->
                </select>
            </div>
            <div class="filter-group">
                <button id="save-preferences" class="save-preferences-btn">Save Preferences</button>
            </div>
        </div>
        <div class="sort-group">
            <label for="sort">Sort By:</label>
            <select id="sort" name="sort">
                <option value="final_price-asc">Price: Low to High</option>
                <option value="final_price-desc">Price: High to Low</option>
            </select>
        </div>
    </section>

    <div class="product-grid"></div>
    <script>
        window.userApiKey = "<?php echo htmlspecialchars($userApiKey); ?>";
    </script>
    <?php include 'footer.php'; ?>
</body>

</html>