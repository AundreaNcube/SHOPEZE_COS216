<?php
session_start();
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}
$userApiKey = isset($_SESSION['user']['api_key']) ? $_SESSION['user']['api_key'] : '';
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Best Deals</title>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="../css/deals.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/filter.css">
    <link rel="stylesheet" href="../css/loader.css">
    <script src="../js/currency.js" defer></script>
    <script src="../js/deals.js" defer></script>
    <script src="../js/logout.js" defer></script>
</head>

<body>
    <?php include 'header.php'; ?>

    <div id="Deals">
        <h1>BEST DEALS!!!!</h1>
        <h2>UP TO 98% OFF</h2>
        <h3>Hurry while stocks last</h3>
    </div>

    <section class="filter-sort">
        <h6>Sort</h6>
        <!-- Filters -->
        <div class="filters">
            <!-- Filter by Price Range -->
            <div class="filter-group">
                <label for="price-range">Price Range:</label>
                <select id="price-range" name="price-range">
                    <option value="all">All Prices</option>
                    <option value="500">Max : 500</option>
                    <option value="1500">Max : 1500</option>
                    <option value="5000">Max : 5000</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="currency-dropdown">Currency:</label>
                <select id="currency-dropdown">
                    <option value="ZAR">ZAR - South African Rand</option>
                    <!-- Options will be populated dynamically -->
                </select>
            </div>

            <!-- Filter by Category -->
            <div class="filter-group">
                <label for="category-dropdown" class="dropdown-label">Category:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="category-dropdown">Select Categories</button>
                    <div class="dropdown-content" id="category-options">
                        <!-- Checkboxes will be added dynamically -->
                    </div>
                </div>
            </div>

            <!-- Filter by Brand -->
            <div class="filter-group">
                <label for="brand-dropdown" class="dropdown-label">Brand:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="brand-dropdown">Select Brands </button>
                    <div class="dropdown-content" id="brand-options">
                        <!-- Checkboxes will be added dynamically -->
                    </div>
                </div>
            </div>

            <!-- Filter by Country of Origin -->
            <div class="filter-group">
                <label for="country-dropdown" class="dropdown-label">Country of Origin:</label>
                <div class="dropdown">
                    <button class="dropdown-btn" id="country-dropdown">Select Countries </button>
                    <div class="dropdown-content" id="country-options">
                        <!-- Checkboxes will be added dynamically -->
                    </div>
                </div>
            </div>

            <!-- Sort Dropdown -->
            <div class="sort-group">
                <label for="sort">Sort By:</label>
                <select id="sort" name="sort">
                    <option value="final_price-asc">Price: Low to High</option>
                    <option value="final_price-desc">Price: High to Low</option>
                    <option value="discount-asc">Discount: Low to High</option>
                    <option value="discount-desc">Discount: High to Low</option>
                </select>
            </div>
        </div>
    </section>

    <div class="product-grid">
        <!-- Products will be loaded here -->
    </div>

    <script>
        window.userApiKey = "<?php echo htmlspecialchars($userApiKey); ?>";
    </script>
    <?php include 'footer.php'; ?>
</body>

</html>