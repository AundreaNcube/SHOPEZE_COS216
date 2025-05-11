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
    <title>My Orders</title>
    <script src="../js/currency.js" defer></script>
    <script src="../js/orders.js" defer></script>
    <script src="../js/theme.js" defer></script>
    <link rel="stylesheet" href="../css/loader.css">
    <link rel="stylesheet" href="../css/orders.css">
    <link rel="stylesheet" href="../css/theme.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="../css/navbarlogo.css">
    <link rel="stylesheet" href="../css/footer.css">
    <link rel="stylesheet" href="../css/logo.css">
</head>
<body class="light-theme">
    <?php include 'header.php'; ?>
    <section class="orders-container">
        <h1>My Orders</h1>
        <div class="orders-list">
            <!-- Orders will be dynamically added here -->
        </div>
    </section>
    <script>
        window.userApiKey = "<?php echo htmlspecialchars($userApiKey); ?>";
    </script>
    <?php include 'footer.php'; ?>
</body>
</html>