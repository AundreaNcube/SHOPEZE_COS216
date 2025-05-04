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
    <title>Shopping Cart</title>

    <!-- JavaScript -->
    <script src="../js/currency.js" defer></script>
    <script src="../js/cart.js" defer></script>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="../css/loader.css">
    <link rel="stylesheet" href="../css/cart.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/footer.css">
    <link rel="stylesheet" href="../css/logo.css">
    <link rel="stylesheet" href="../css/wish_cart_filter.css">
</head>

<body>
<?php include 'header.php'; ?>


    <section class="filter-sort">
        <h6>l</h6>
        <div class="filters">
            <div class="filter-group">
                <label for="currency-dropdown">Select Currency:</label>
                <select id="currency-dropdown">
                    <!-- Populated dynamically by currency.js -->
                </select>
            </div>
        </div>
    </section>

    <div class="cart-container">
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Remove</th>
                </tr>
            </thead>
            <tbody>
                <!-- Cart items will be dynamically added here -->
            </tbody>
        </table>

        <div class="cart-summary">
            <h2>Cart Summary</h2>
            <p>Subtotal: <span id="subtotal">ZAR 0.00</span></p>
            <p>Grand Total: <span id="grand-total">ZAR 0.00</span></p>
            <button class="checkout-btn">Proceed to Checkout</button>
        </div>
    </div>

    <script>
        window.userApiKey = "<?php echo htmlspecialchars($userApiKey); ?>";
    </script>
    <?php include 'footer.php'; ?>
</body>

</html>