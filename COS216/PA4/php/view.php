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
    <title>View More</title>

    <!-- Stylesheets -->
    <link rel="stylesheet" href="../css/view.css">
    <link rel="stylesheet" href="../css/theme.css">
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/footer.css">
    <link rel="stylesheet" href="../css/logo.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- JavaScript -->
    <script src="../js/utils.js" defer></script>
    <script src="../js/view.js" defer></script>
    <script src="../js/theme.js" defer></script>
</head>

<body class="light-theme">
    <?php include 'header.php'; ?>

    <section class="product-details">
        <div class="carousel">
            <img id="main-image" src="img/screen.jpg" alt="Product Image">
            <button id="prev-btn" class="carousel-btn prev" aria-label="Previous Image">❮</button>
            <button id="next-btn" class="carousel-btn next" aria-label="Next Image">❯</button>
            <div class="thumbnail-container" id="thumbnail-container">
            </div>
        </div>

        <div class="details">
            <h1 id="product-title">y</h1>
            <p class="price" id="product-price"></p>
            <p><strong>Category:</strong> <span id="product-category"></span></p>
            <p><strong>Availability:</strong> <span id="product-availability"></span></p>

            <h3>Product Description</h3>
            <p id="product-description"></p>

            <h3>Features</h3>
            <ul id="product-features"></ul>

            <h3>Additional Attributes</h3>
            <ul id="additional-attributes"></ul>

            <button id="add-to-cart">Add to Cart</button>
            <button id="add-to-wishlist">Add to Wishlist</button>
        </div>
    </section>

    <?php include 'footer.php'; ?>
</body>

</html>