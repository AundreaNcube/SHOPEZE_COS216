<?php
//header.php 
require_once 'config.php';
?>

<!-- Shared Stylesheets -->
<link rel="stylesheet" href="../css/navbarlogo.css">
<link rel="stylesheet" href="../css/logo.css">
<link rel="stylesheet" href="../css/loader.css">

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<style>
    .nav-links {
        list-style: none;
        display: flex;
        gap: 15px;
    }

    .nav-links li a {
        text-decoration: none;
        color: #333;
    }

    .nav-links li a:hover {
        color: rgb(255, 0, 0);
    }
</style>

<!-- Loader Animation -->
<div id="loader-container">
    <div class="boxes">
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        <div class="box">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
</div>

<!-- Navbar -->
<div id="content" style="display: none;">
    <nav class="navbar">
        <div class="logo">
            <div class="shopping-cart">
                <div class="cart-basket"></div>
                <div class="cart-handle"></div>
                <div class="cart-wheels">
                    <div class="wheel"></div>
                    <div class="wheel"></div>
                </div>
            </div>
            <h2>ShopEze</h2>
        </div>
        <?php if (isset($_SESSION['user'])): ?>

            <div class="search">
                <input class="input" placeholder="Search here..." type="text">
                <button type="submit">Go</button>
            </div>
        <?php endif; ?>

        <div class="nav-container">
            <ul class="nav-links">
                <?php if (isset($_SESSION['user'])): ?>
                    <li><a href="index.php">Products</a></li>
                    <li><a href="deals.php">Best Deals</a></li>
                    <li><a href="wishlist.php">Wishlist</a></li>
                    <li><a href="cart.php">Cart</a></li>
                    <li><a href="logout.php">Logout</a></li>
                <?php else: ?>
                    <li><a href="login.php">Login</a></li>
                    <li><a href="signup.php">Register</a></li>
                <?php endif; ?>
            </ul>
            <?php if (isset($_SESSION['user'])): ?>
                <div class="welcome-message">
                    Welcome, <?php echo htmlspecialchars($_SESSION['user']['name'] ?? 'User'); ?>
                </div>
            <?php endif; ?>
        </div>
    </nav>
</div>

<!-- for the loader -->
<script>
    window.addEventListener('load', function() {
        document.getElementById('loader-container').style.display = 'none';
        document.getElementById('content').style.display = 'block';
    });
</script>