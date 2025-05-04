<?php
session_start();
if (isset($_SESSION['user'])) {
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShopEze - Login</title>
    <!-- Page-specific styles -->
    <link rel="stylesheet" href="../css/login.css">
    <!-- Shared styles -->
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/logo.css">
    <link rel="stylesheet" href="../css/loader.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <!-- Script -->
    <script src="../js/login.js" defer></script>
</head>
<body>
    <?php include 'header.php'; ?>
    <section class="login-container">
        <h2>Log In</h2>
        <form id="login-form">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <span id="email-error" class="error-message"></span>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <span id="password-error" class="error-message"></span>
            <button type="submit">Log In</button>
        </form>
        <p id="login-form-message"></p>
    </section>
    <?php include 'footer.php'; ?>
</body>
</html>