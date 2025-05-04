<?php
// wishlist.php
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
    <title>Wishlist</title>
    
    <link rel="stylesheet" href="../css/wishlist.css">
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/footer.css">
    <link rel="stylesheet" href="../css/logo.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/wish_cart_filter.css">
    <link rel="stylesheet" href="../css/loader.css">

    <script src="../js/currency.js" defer></script>
    <script src="../js/wishlist.js" defer></script>
</head>

<body>
<?php include 'header.php'; ?>

    <section class="filter-sort">
        <h6>Filters</h6>
        <div class="filters">
            <div class="filter-group">
                <label for="currency-dropdown">Select Currency:</label>
                <select id="currency-dropdown">
                </select>
            </div>
        </div>
    </section>

    <div class="wishlist-container">
    </div>

    <script>
        window.userApiKey = "<?php echo htmlspecialchars($userApiKey); ?>";
    </script>

    <!-- Footer -->
    <?php include 'footer.php'; ?>
</body>
</html>
