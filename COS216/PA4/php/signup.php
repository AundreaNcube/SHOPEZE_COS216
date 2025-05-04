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
    <title>ShopEze - Signup</title>
    <link rel="stylesheet" href="../css/signup.css">
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/logo.css">
    <link rel="stylesheet" href="../css/loader.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="../js/signup.js" defer></script>
</head>

<body>
    <?php include 'header.php'; ?>
    <section class="signup-container">
        <h2>Sign Up</h2>

        <?php if (isset($_SESSION['signup_message'])): ?>
            <p class="session-message"><?php echo htmlspecialchars($_SESSION['signup_message']);
                                        unset($_SESSION['signup_message']); ?></p>
        <?php endif; ?>

        <form id="signup-form" method="post">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
            <span id="name-error" class="error-message"></span>


            <label for="surname">Surname:</label>
            <input type="text" id="surname" name="surname" required>
            <span id="surname-error" class="error-message"></span>


            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
            <span id="email-error" class="error-message"></span>

            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
            <span id="password-error" class="error-message"></span>
            <label for="type">Account Type:</label>

            <select id="type" name="type" required>
                <option value="customer">Customer</option>
                <option value="courier">Courier</option>
                <option value="inventory manager">Inventory Manager</option>
            </select>

            <button type="submit">Register</button>
        </form>
        <div id="form-message"></div> <!-- this id is used by signup.js for all on screen messages-->
    </section>
    <?php include 'footer.php'; ?>
</body>

</html>